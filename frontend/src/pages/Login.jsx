import React, { useState } from 'react';
import './Login.css';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Login = () => {
    // 1. Define the state to store what the user types
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // 2. Initialize it

    // 2. ADD THE handleLogin FUNCTION HERE
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/login', { email, password });

            // The backend sent back the role!
            const userRole = res.data.user.role;

            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('token', res.data.token);
            if (userRole === 'doctor') {
                navigate('/doctor-dashboard');
            } else {
                navigate('/patient-dashboard');
            }
        } catch (err) {
            // Check if backend sent a specific error message, else use default
            alert(err.response?.data?.message || "Invalid email or password");
        }
        finally {
            setLoading(false);
        }
    };

    // 3. The JSX (The form that calls the function)
    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Login</h2>
                <form className="login-form" onSubmit={handleLogin}>
                    <input
                        className="login-input"
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="login-input"
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                    Don't have an account? <Link to="/signup" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;