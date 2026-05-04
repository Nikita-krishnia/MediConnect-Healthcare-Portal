import React, { useEffect, useState } from 'react';
import './DoctorDashboard.css';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [consultationNotes, setConsultationNotes] = useState({});
    const [availability, setAvailability] = useState({ day: 'Monday', start: '', end: '' });
    // 1. Add a state to store the full schedule
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            try {
                // 1. Fetch Appointments
                const apptRes = await API.get(`/appointments/doctor/${user.id}`);
                // Ensure we set the state immediately so the "Today" stats can calculate
                setAppointments(apptRes.data);

                // 2. Fetch Schedule - UPDATED URL to match new server.js route
                const availRes = await API.get(`/availability/user/${user.id}`);

                const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                // Use a defensive check (availRes.data || []) to prevent .sort errors if data is empty
                const sortedData = (availRes.data || []).sort((a, b) =>
                    daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
                );

                setSchedule(sortedData);
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            }
        };

        fetchInitialData();
    }, [user]);


    const updateStatus = async (appointmentId, newStatus) => {
        try {
            const noteText = consultationNotes[appointmentId] || "";
            await API.put(`/appointments/${appointmentId}`, {
                status: newStatus,
                consultation_notes: noteText
            });

            setAppointments(prev => prev.map(app =>
                app.id === appointmentId ? { ...app, status: newStatus, consultation_notes: noteText } : app
            ));
        } catch (err) {
            alert("Update failed. Please try again.");
            console.error(err);
        }
    };

    const handleSetAvailability = async () => {
        try {
            await API.post('/availability', {
                doctorId: user.id, // This is the logged-in user's ID
                day: availability.day,
                startTime: availability.start,
                endTime: availability.end
            });

            alert("Schedule updated!");

            // FIXED: Updated URL to include '/user/' to match the new server.js route
            const res = await API.get(`/availability/user/${user.id}`);

            // Optional: Re-sort the data so it stays in Monday-Sunday order
            const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const sortedData = (res.data || []).sort((a, b) =>
                daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
            );

            setSchedule(sortedData);
        } catch (err) {
            console.error("Error updating availability:", err);
            alert("Failed to update schedule.");
        }
    };


    const handleDeleteAvailability = async (availabilityId) => {
        if (window.confirm("Are you sure you want to remove these hours?")) {
            try {
                await API.delete(`/availability/${availabilityId}`);

                // Update the local list by filtering out the deleted ID
                setSchedule(prevSchedule =>
                    prevSchedule.filter(item => item.id !== availabilityId)
                );

                alert("Hours removed!");
            } catch (err) {
                console.error("Error deleting availability:", err);
                alert("Failed to remove hours.");
            }
        }
    };


    // Ensure we are only counting appointments for the LOGGED-IN doctor
    const todayStr = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD for your timezone

    const todaysAppointments = appointments.filter(app => {
        const appDate = new Date(app.appointment_date).toLocaleDateString('en-CA');
        return appDate === todayStr;
    });

    // These will now correctly show 0 if no appointments match today's date
    const totalToday = todaysAppointments.length;
    const completedToday = todaysAppointments.filter(app => app.status === 'completed').length;
    const pendingToday = totalToday - completedToday;


    return (
        <div className="doctor-dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Doctor Dashboard</h1>
                <p className="welcome-text">Welcome, Doctor <strong>{user?.email}</strong></p>
            </div>
            <div className="stats-container" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <StatCard label="Total Today" value={totalToday} />
                <StatCard label="Completed" value={completedToday} type="completed" />
                <StatCard label="Remaining" value={pendingToday} type="pending" />
            </div>
            <div className="dashboard-section">
                <h3 className="section-title">Your Scheduled Appointments</h3>
                {appointments.length === 0 ? (
                    <p className="empty-state">No appointments scheduled yet.</p>
                ) : (
                    <table className="appointments-table">
                        <thead>
                            <tr><th>Patient Email</th><th>Date</th><th>Medical History</th><th>Consultation Notes</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {appointments.map(app => {
                                const appointmentDate = new Date(app.appointment_date);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isPastOrToday = appointmentDate <= today;

                                return (
                                    <tr key={app.id}>
                                        <td>{app.patient_email}</td>
                                        <td>{new Date(app.appointment_date).toLocaleDateString()}</td>
                                        <td><button className="view-btn" onClick={() => alert(`Patient History: ${app.medical_history || 'No history provided'}`)}>View History</button></td>
                                        <td>{app.status === 'confirmed' && isPastOrToday ? (<textarea className="note-input" placeholder="Add visit summary..." onChange={(e) => setConsultationNotes({ ...consultationNotes, [app.id]: e.target.value })} />) : (<span className="saved-note">{app.consultation_notes || "N/A"}</span>)}</td>
                                        <td>
                                            <StatusBadge status={app.status} />
                                        </td>                                        <td>
                                            <div className="action-buttons">
                                                {app.status === 'pending' && (<button className="confirm-button" onClick={() => updateStatus(app.id, 'confirmed')}>Confirm</button>)}
                                                {app.status === 'confirmed' && isPastOrToday && (<button className="complete-button" onClick={() => updateStatus(app.id, 'completed')}>Mark Done</button>)}
                                                {app.status === 'confirmed' && !isPastOrToday && (<span style={{ color: '#666', fontSize: '12px' }}>Upcoming</span>)}
                                                {app.status === 'completed' && (<span style={{ color: 'gray', fontStyle: 'italic' }}>Finished</span>)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="dashboard-section availability-setter">
                <h3 className="section-title">Manage Your Weekly Availability</h3>
                <div className="availability-form">
                    <div className="input-group">
                        <label>Day:</label>
                        <select
                            value={availability.day}
                            onChange={(e) => setAvailability({ ...availability, day: e.target.value })}
                            className="auth-input"
                        >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Start Time:</label>
                        <input
                            type="time"
                            className="auth-input"
                            onChange={(e) => setAvailability({ ...availability, start: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label>End Time:</label>
                        <input
                            type="time"
                            className="auth-input"
                            onChange={(e) => setAvailability({ ...availability, end: e.target.value })}
                        />
                    </div>

                    <button className="confirm-button" onClick={handleSetAvailability}>
                        Save Hours
                    </button>
                </div>
            </div>

            <div className="current-schedule">
                <h4>Your Current Weekly Hours:</h4>
                {schedule.length === 0 ? (
                    <p>No hours set yet.</p>
                ) : (
                    <ul className="schedule-list">
                        {schedule.map(item => (
                            <li key={item.id}>
                                <strong>{item.day_of_week}:</strong> {item.start_time} - {item.end_time}
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteAvailability(item.id)}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>


        </div>
    );
};

export default DoctorDashboard;