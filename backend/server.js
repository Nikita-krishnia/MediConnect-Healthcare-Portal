require('dotenv').config(); // Load the .env file at the very top
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "https://mediconnect-frontend-pi.vercel.app"],
  credentials: true
}));
app.use(express.json());
// --- DATABASE CONNECTION ---
// Robust configuration for Aiven MySQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || process.env.DB_PASS, 
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 25060, // Aiven standard port is 25060
    ssl: {
        rejectUnauthorized: false
    }
};

console.log("--- DB Config Check ---");
console.log("Host:", dbConfig.host);
console.log("User:", dbConfig.user);
console.log("Database:", dbConfig.database);
console.log("Port:", dbConfig.port);

const db = mysql.createConnection(dbConfig);
const dbPromise = db.promise();

db.connect((err) => {
    if (err) {
        console.error('❌ CRITICAL: Database Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Message:', err.message);

        if (err.code === 'ENOTFOUND') {
            console.error('\n💡 DEBUG HINT: Your hostname could not be found.');
            console.error('Check your .env for typos. Is "nikitakrishnia" spelled correctly? (Aiven usually uses "nikitakrishna")');
        }
        return;
    }
    console.log('✅ Connected to Aiven MySQL! 🚀');
});

// --- AUTH ROUTES ---
app.post('/api/signup', async (req, res) => {
    // If you don't see this in your terminal, the frontend isn't hitting this server!
    console.log(">>>> HIT SIGNUP ROUTE <<<<"); 
    console.log("Body received:", req.body);

    const { email, password, role, fullName, specialty } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Insert User
        const [userResult] = await dbPromise.query(
            "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
            [email, hashedPassword, role]
        );

        const userId = userResult.insertId;
        console.log("User created ID:", userId);

        // 2. Insert Doctor
        if (role === 'doctor') {
            if (!fullName) throw new Error("fullName is missing from request body");
            
            await dbPromise.query(
                "INSERT INTO doctors (user_id, full_name, specialty) VALUES (?, ?, ?)",
                [userId, fullName, specialty || null]
            );
            console.log("Doctor profile created.");
        }

        return res.status(201).json({ message: "Signup successful!" });

    } catch (err) {
        console.error("--- SIGNUP ERROR ---");
        console.error("Message:", err.message);
        if (err.sqlMessage) console.error("SQL Message:", err.sqlMessage);
        
        return res.status(500).json({ 
            message: "Signup failed", 
            details: err.message 
        });
    }
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err || result.length === 0) return res.status(404).json({ message: "User not found" });
        const user = result[0];
        if (await bcrypt.compare(password, user.password)) {
            res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
        } else {
            res.status(401).json({ message: "Wrong password" });
        }
    });
});

// --- DOCTOR DASHBOARD ROUTES ---

// 1. Fetch Appointments for Doctor
app.get('/api/appointments/doctor/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `
        SELECT a.id, a.appointment_date, a.status, a.medical_history, a.consultation_notes, u.email AS patient_email 
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = ?
        ORDER BY a.appointment_date DESC`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

// 2. Manage Availability (UPSERT Logic - Keep this one!)
app.post('/api/availability', (req, res) => {
    const { doctorId, day, startTime, endTime } = req.body;
    const sql = `
        INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) 
        VALUES ((SELECT id FROM doctors WHERE user_id = ?), ?, ?, ?)
        ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)`;
    
    db.query(sql, [doctorId, day, startTime, endTime], (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json(err);
        }
        res.status(201).json({ message: "Availability synced successfully!" });
    });
});

// 3. Fetch Availability for Doctor (using User ID)
app.get('/api/availability/user/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `SELECT * FROM doctor_availability WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = ?)`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

// 4. Fetch Availability for Patient (using Doctor PK)
app.get('/api/availability/:doctorId', (req, res) => {
    const { doctorId } = req.params;
    const sql = `SELECT * FROM doctor_availability WHERE doctor_id = ?`;
    db.query(sql, [doctorId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

// 5. Update Appointment Note/Status
app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status, consultation_notes } = req.body;
    db.query("UPDATE appointments SET status = ?, consultation_notes = ? WHERE id = ?", [status, consultation_notes || "", id], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).send();
    });
});

// --- PATIENT ROUTES ---
app.get('/api/doctors', (req, res) => {
    db.query("SELECT id, full_name, specialty FROM doctors", (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

app.post('/api/appointments', (req, res) => {
    const { patientId, doctorId, appointmentDate, medicalHistory } = req.body;
    db.query("INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, medical_history) VALUES (?, ?, ?, 'pending', ?)", 
    [patientId, doctorId, appointmentDate, medicalHistory], (err) => {
        if (err) return res.status(500).json(err);
        res.status(201).send();
    });
});

app.get('/api/appointments/patient/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `
        SELECT 
            a.id, a.appointment_date, a.status, a.consultation_notes,
            d.full_name AS doctor_name, d.specialty,
            avail.start_time,
            (SELECT COUNT(*) FROM appointments a2 
             WHERE a2.doctor_id = a.doctor_id 
             AND DATE(a2.appointment_date) = DATE(a.appointment_date) 
             AND a2.id < a.id) AS patients_ahead
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN doctor_availability avail ON d.id = avail.doctor_id 
             AND avail.day_of_week = DAYNAME(a.appointment_date)
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC`;

    db.query(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

app.delete('/api/availability/:id', (req, res) => {
    db.query("DELETE FROM doctor_availability WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).send();
    });
});

// Update the port to be dynamic for deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));