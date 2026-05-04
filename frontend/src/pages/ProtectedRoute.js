import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. If no user is logged in, send them to login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 2. If a specific role is needed (e.g., doctor) but user doesn't have it
    if (roleRequired && user.role !== roleRequired) {
        return <Navigate to="/login" />;
    }

    // 3. If everything is fine, show the page
    return children;
};

export default ProtectedRoute;