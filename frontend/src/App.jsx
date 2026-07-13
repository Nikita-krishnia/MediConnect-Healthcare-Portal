import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Navbar from './pages/Navbar';
import './App.css'; // This connects the CSS file to this JS file
import ProtectedRoute from './pages/ProtectedRoute';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <div className="main-container">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === 'doctor' ? "/doctor-dashboard" : "/patient-dashboard"} />
              ) : (
                <Login />
              )
            }
          />

          {/* 2. SIGNUP PATH */}
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to={user.role === 'doctor' ? "/doctor-dashboard" : "/patient-dashboard"} />
              ) : (
                <Signup />
              )
            }
          />

          {/* 3. DOCTOR DASHBOARD (Protected) */}
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute roleRequired="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* 4. PATIENT DASHBOARD (Protected) */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute roleRequired="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: Redirect any unknown URL to Home (Login) */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;