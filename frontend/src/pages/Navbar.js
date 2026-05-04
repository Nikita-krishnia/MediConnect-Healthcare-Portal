import React from "react";
import {useNavigate} from "react-router-dom";
import "./Navbar.css";

const Navbar=()=>{
    const navigate=useNavigate();
    const user=JSON.parse(localStorage.getItem('user'));

    const handleLogout=()=>{
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    if(!user) return null;

    return(
        <nav className="navbar">
            <h2 className="navbar-logo">MediConnect✨</h2>

            <div className="navbar-links">
                <span>logged in as:<strong>{user.email}</strong></span>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
