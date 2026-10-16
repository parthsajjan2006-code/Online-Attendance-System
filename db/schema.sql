-- Online Student Attendance Management System (Online SAMS)
-- Database Schema Script

CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    course VARCHAR(50),
    semester INT,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100)
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, subject_id, attendance_date)
);

-- Default Admin Account (admin / admin123)
INSERT INTO admin (username, password)
SELECT 'admin', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE username = 'admin');

-- Sample Subjects (if table empty)
INSERT INTO subjects (subject_name)
SELECT 'Java Programming' WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = 'Java Programming');
INSERT INTO subjects (subject_name)
SELECT 'Python' WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = 'Python');
INSERT INTO subjects (subject_name)
SELECT 'Theory of Computation' WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = 'Theory of Computation');
INSERT INTO subjects (subject_name)
SELECT 'Data Structures' WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = 'Data Structures');
INSERT INTO subjects (subject_name)
SELECT 'Operating Systems' WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name = 'Operating Systems');
