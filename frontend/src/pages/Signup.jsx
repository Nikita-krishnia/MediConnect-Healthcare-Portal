import React, { useState } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');

    const [fullName, setFullName] = useState('');
    const [specialty, setSpecialty] = useState('');

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // point this to Node.js server port
            const res = await API.post('/signup', {
                email,
                password,
                role,
                fullName,
                specialty
            });

            alert(res.data.message);
            navigate('/login'); // Redirect to login page after successful signup
        } catch (err) {
            alert(err.response?.data?.message || "Signup failed");
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Healthcare Portal Signup</h2>
                <form className="signup-form" onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="form-label">Email:</label>
                        <input
                            className="signup-input"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password:</label>
                        <input
                            className="signup-input"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">I am a:</label>
                        <select
                            className="signup-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>

                    {role === 'doctor' && (
                        <div className="doctor-fields">
                            <div className="form-group">
                                <label className="form-label">Full Name:</label>
                                <input
                                    className="signup-input"
                                    type="text"
                                    placeholder="Dr. John Doe"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Specialty:</label>
                                <input
                                    className="signup-input"
                                    type="text"
                                    placeholder="e.g. Cardiologist"
                                    required
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button className="signup-button" type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;