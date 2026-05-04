import React, { useState, useEffect, useCallback } from 'react';
import './PatientDashboard.css';
import API from '../api';

const PatientDashboard = () => {
    const [doctors, setDoctors] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [selectedDate, setSelectedDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('All');
    const [medicalHistory, setMedicalHistory] = useState('');

    const [selectedDoctorAvailability, setSelectedDoctorAvailability] = useState([]);

// useCallback ensures the function doesn't change on every render
const fetchData = useCallback(async () => {
    try {
        const doctorsRes = await API.get('/doctors');
        setDoctors(doctorsRes.data);

        const appointmentsRes = await API.get(`/appointments/patient/${user.id}`);
        setMyAppointments(appointmentsRes.data);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}, [user?.id]); // It only recreates if the user ID changes

useEffect(() => {
    if (user) fetchData();
}, [user, fetchData]); // Both are now stable dependencies

    const handleBook = async (doctorId) => {
        if (!selectedDate) return alert("Please select a date!");

        try {
            const res = await API.get(`/availability/${doctorId}`);
            const currentAvailability = res.data;

            // FIXED: Split string to avoid timezone shifting
            const [year, month, day] = selectedDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[dateObj.getDay()]; // Use getDay() instead of getUTCDay()

            console.log("Checking availability for:", dayName);

            const isAvailable = currentAvailability.some(slot => slot.day_of_week === dayName);

            if (!isAvailable) {
                return alert(`This doctor does not work on ${dayName}s. Please pick another date.`);
            }

            // Proceed with booking...
            await API.post('/appointments', {
                patientId: user.id,
                doctorId: doctorId,
                appointmentDate: selectedDate,
                medicalHistory: medicalHistory
            });

            alert("Booked successfully!");
            setSelectedDate('');
            setMedicalHistory('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Booking failed.");
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await API.delete(`/appointments/${id}`);
                alert("Cancelled successfully");
                fetchData(); // Refresh list smoothly
            } catch (err) { alert("Error cancelling"); }
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = filterSpecialty === 'All' || doc.specialty === filterSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    const fetchDoctorAvailability = async (doctorId) => {
        try {
            const res = await API.get(`/availability/${doctorId}`);
            setSelectedDoctorAvailability(res.data);
        } catch (err) {
            console.error("Error fetching availability:", err);
        }
    };



    const calculateEstTime = (startTime, ahead) => {
        if (!startTime) return "TBD";
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (ahead * 15);
        const estHours = Math.floor(totalMinutes / 60);
        const estMins = totalMinutes % 60;
        return `${estHours}:${estMins < 10 ? '0' + estMins : estMins}`;
    };


    const specialties = ['All', ...new Set(doctors.map(doc => doc.specialty))];

    return (
        <div className="patient-dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Patient Dashboard</h1>
                <p className="welcome-text">Welcome, <strong>{user?.email}</strong></p>
            </div>

            {/* SEARCH & FILTER SECTION */}
            <div className="search-section" style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                background: 'rgba(255,255,255,0.5)',
                padding: '20px',
                borderRadius: '10px'
            }}>
                <input
                    type="text"
                    placeholder="Search Doctor by Name..."
                    className="auth-input"
                    style={{ flex: 3, padding: '10px', margin: 0 }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="auth-input"
                    style={{ flex: 1, margin: 0 }}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                >
                    {specialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                    ))}
                </select>
            </div>

            {/* MY APPOINTMENTS TABLE */}
            <div className="dashboard-section">
                <h3 className="section-title">My Appointment History</h3>
                {myAppointments.length === 0 ? (
                    <p className="empty-state">No appointments booked yet.</p>
                ) : (
                    <table className="appointments-table">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Doctor's Remarks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myAppointments.map(app => (
                                <tr key={app.id}>
                                    <td>
                                        <strong>{app.doctor_name}</strong>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{app.specialty}</div>
                                    </td>
                                    <td>{new Date(app.appointment_date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${app.status}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>
                                        {app.status === 'completed' ? (
                                            <div className="notes-box">
                                                {app.consultation_notes || "No notes provided"}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#aaa', fontSize: '12px' }}>Awaiting visit</span>
                                        )}
                                    </td>
                                    <td>
                                        {app.status === 'pending' || app.status === 'confirmed' ? (
                                            <button
                                                className="cancel-btn"
                                                onClick={() => handleCancel(app.id)}
                                            >
                                                Cancel
                                            </button>
                                        ) : (
                                            <span style={{ color: 'gray' }}>Completed</span>
                                        )}
                                    </td>
                                    <td>
                                        {app.status === 'pending' || app.status === 'confirmed' ? (
                                            <div className="queue-info">
                                                <strong>Turn: #{app.patients_ahead + 1}</strong>
                                                <span>
                                                    Est: <span className="est-time-highlight">
                                                        {calculateEstTime(app.start_time, app.patients_ahead)}
                                                    </span>
                                                </span>
                                            </div>
                                        ) : (
                                            <span>Visit Over</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <hr style={{ margin: '40px 0', opacity: '0.2' }} />

            {/* BOOKING SECTION */}
            <div className="dashboard-section">
                <h3 className="section-title">Book a New Appointment</h3>

                <div className="booking-form-container" style={{ maxWidth: '600px', marginBottom: '30px' }}>
                    <div className='form-group'>
                        <label>Reason for Visit / Medical History:</label>
                        <textarea
                            className="auth-input history-textarea"
                            value={medicalHistory}
                            placeholder="Briefly describe your symptoms..."
                            style={{ height: '80px', resize: 'none' }}
                            onChange={(e) => setMedicalHistory(e.target.value)}
                        />
                    </div>

                    <div className="date-picker-container" style={{ marginTop: '15px' }}>
                        <label className="date-picker-label">Select Date: </label>
                        <input
                            type="date"
                            className="date-input"
                            value={selectedDate}
                            min={new Date().toISOString().split("T")[0]} // Prevents booking past dates
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="doctors-grid">
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map(doc => (
                            <div key={doc.id} className="doctor-card">
                                <h4 className='doctor-name'>{doc.full_name}</h4>
                                <p className='doctor-specialty'>{doc.specialty}</p>

                                {/* NEW: Button to view the doctor's weekly hours */}
                                <button
                                    className="view-btn"
                                    onClick={() => fetchDoctorAvailability(doc.id)}
                                    style={{ fontSize: '11px', marginBottom: '10px' }}
                                >
                                    Check Availability
                                </button>

                                {/* Display hours if they were fetched for this specific doctor */}
                                <div className="availability-display">
                                    {selectedDoctorAvailability.length > 0 &&
                                        selectedDoctorAvailability[0].doctor_id === doc.id ? (
                                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '12px', color: '#555' }}>
                                            {selectedDoctorAvailability.map(slot => (
                                                <li key={slot.id}>
                                                    <strong>{slot.day_of_week}:</strong> {slot.start_time} - {slot.end_time}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>

                                <button className="book-button" onClick={() => handleBook(doc.id)}>
                                    Book Appointment
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="empty-state">No doctors found matching your criteria.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;