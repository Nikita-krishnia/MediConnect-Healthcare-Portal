import React from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link
import "./Navbar.css";

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    return (
        <nav className="navbar">
            {/* The logo should always be visible and link to home */}
            <h2 className="navbar-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                MediConnect✨
            </h2>

            <div className="navbar-links">
                {user ? (
                    <>
                        <span>Logged in as: <strong>{user.email}</strong></span>
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        {/* Show these when NO one is logged in */}
                        <Link to="/" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link" style={{ marginLeft: '15px' }}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;