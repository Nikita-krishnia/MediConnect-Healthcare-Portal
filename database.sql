-- Active: 1777883861079@@mysql-32118427-nikitakrishnia08-7402.l.aivencloud.com@13520@defaultdb
USE defaultdb;

-- 2. Create Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Doctors Table (Specialty & Profile)
-- This MUST be in defaultdb for your signup to work
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create Appointments Table (Booking)
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'completed') DEFAULT 'pending',
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

ALTER TABLE appointments ADD COLUMN medical_history TEXT;

ALTER TABLE appointments ADD COLUMN consultation_notes TEXT;

-- 5. Cleanup failed signup data
-- Delete the email that was partially registered so you can try again
DELETE FROM users WHERE email = 'dd@gmail.com';

select * from users;


-- Create the availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS doctor_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Optional: Add some dummy data so the GET request isn't empty
-- Replace '1' with the actual doctor_id you just created (ID: 47)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) 
VALUES (1, 'Monday', '09:00:00', '17:00:00');