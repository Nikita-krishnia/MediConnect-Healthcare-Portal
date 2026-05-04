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
                <Signup />
              )
            }
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.role === 'doctor' ? "/doctor-dashboard" : "/patient-dashboard"} />
              ) : (
                <Login />
              )
            }
          />
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />

          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute roleRequired="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Locked for Patients Only */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute roleRequired="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </Router>


  );
}

export default App;