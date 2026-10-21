# Online Student Attendance Management System (Online SAMS)

A full-stack, modern, responsive web application for managing student attendance, faculties, subjects, and analytics reports. Built using **HTML5, CSS3, JavaScript (Vanilla ES6+), Java 21 (Embedded HTTP Server & REST API), and MySQL 8.0 (JDBC Driver)**.

---

## 🌟 Key Features

### 🛡️ 1. Administrator Portal (`admin.html`)
- **Dashboard Overview**: Real-time KPI statistics including Total Students, Total Faculty, Total Subjects, Today's Attendance Rate %, and All-time logs.
- **Student Management (CRUD)**: Register, update, search, filter by course/semester, and delete students.
- **Faculty Management (CRUD)**: Add, edit, search, and manage teachers.
- **Subject Management (CRUD)**: Add, rename, and manage academic subjects.
- **Master Attendance Logs**: View and filter historical records with one-click status modification and deletion.
- **Analytics & Reporting**: Subject-wise and student-wise attendance aggregates, color-coded eligibility badges (`>= 75% Eligible`, `< 75% Shortage`), CSV export, and print formatting.

### 👨‍🏫 2. Teacher / Faculty Portal (`teacher.html`)
- **Interactive Attendance Sheet**: Load class rosters with live date and subject selectors.
- **One-Click Marking**: Large touch-friendly toggle buttons for **Present** and **Absent**.
- **Bulk Helpers**: "Mark All Present" / "Mark All Absent" buttons for rapid grading.
- **Live Counter**: Instant calculation of total students, present count, absent count, and class percentage before submitting.
- **Past Record Modifier**: Search previous lecture attendance and toggle status with immediate database synchronization.
- **Subject Analytics**: Track student participation rates and identify students facing attendance shortages.

### 🎓 3. Student Portal (`student.html`)
- **Personalized Attendance Overview**: Overall attendance percentage badge and status indicator.
- **Shortage Warning Alert**: Prominent notice when attendance falls below the mandatory 75% threshold.
- **Subject-wise Breakdown Cards**: Classes held, classes attended, visual progress bars.
- **Attendance Target Calculator**:
  - *Below 75%*: Tells students exactly how many upcoming consecutive lectures they must attend to cross 75%.
  - *Above 75%*: Informs students how many lectures they can safely miss without dipping below 75%.
- **Chronological History Timeline**: View historical lecture attendance with date, subject, and status badges.
- **Password Management**: Change student account password securely.

---

## ☁️ Deploy on Vercel (1-Click Cloud Deployment)

This project is pre-configured with `vercel.json` and a built-in serverless API router in `api/index.js`, making it ready to deploy on **Vercel** directly from GitHub:

1. Go to **[vercel.com](https://vercel.com)** and sign in with your GitHub account (`parthsajjan2006-code`).
2. Click **"Add New..."** → **"Project"**.
3. Locate **`Online-Attendance-System`** from your repository list and click **"Import"**.
4. Leave all default settings unchanged (the included `vercel.json` automatically configures routes, static pages, and serverless functions).
5. Click **"Deploy"**!

Within seconds, Vercel will build and provide a live public URL (e.g. `https://online-attendance-system.vercel.app`) where the entire application, portals, and reports work live on the web!

---

## 🚀 Quick Start Guide (Local Java + MySQL)

### Prerequisites
1. **Java JDK 21+** (`java` and `javac` installed)
2. **MySQL Server 8.0+** running on `localhost:3306`

### 1. Launch with One Click (Windows)
Double-click `run.bat` or run in PowerShell:
```powershell
.\start.ps1
```
The script will compile the Java classes into `bin/` and start the embedded web server.

### 2. Access the Web Application
Open your browser and navigate to:
```
http://localhost:8085
```
*(If port 8085 is in use, the server automatically selects the next available port and prints the URL to the terminal).*

---

## 🔑 Default Login Credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full administrative control |
| **Teacher** | `Nikhil` | `nikhil123` | Faculty member |
| **Student** | `parth` | `parth123` | B.Sc CS Semester 5 |
| **Student** | `pranav` | `pranav123` | B.Sc CS Semester 5 |
| **Student** | `aditya` | `adi@123` | B.Sc CS Semester 5 |

*Tip: The login page includes convenient **Quick Demo Login** buttons that auto-fill credentials with one click!*

---

## 🗄️ Database Configuration

Configuration settings are stored in [config.properties](file:///c:/Users/admin/OneDrive/Documents/Online%20SAMS/config.properties):
```properties
server.port=8085
db.url=jdbc:mysql://localhost:3306/attendance_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
db.user=root
db.password=Redhat@123
```

The database schema and sample data script is available in [db/schema.sql](file:///c:/Users/admin/OneDrive/Documents/Online%20SAMS/db/schema.sql).

---

## 📂 Project Architecture

```
Online SAMS/
├── bin/                      # Compiled Java class binaries
├── config.properties         # Server port and MySQL connection settings
├── db/
│   └── schema.sql            # MySQL database initialization script
├── lib/
│   └── mysql-connector-j-26.7.0.jar  # MySQL JDBC driver
├── src/
│   └── com/
│       └── sams/
│           ├── Main.java             # Application entrypoint
│           ├── Server.java           # Embedded HTTP server & routing
│           ├── config/
│           │   └── DbConfig.java     # JDBC connection pool & schema check
│           ├── dao/                  # Data Access Object layer
│           │   ├── AdminDao.java
│           │   ├── AttendanceDao.java
│           │   ├── StudentDao.java
│           │   ├── SubjectDao.java
│           │   └── TeacherDao.java
│           ├── handlers/             # REST API & static file handlers
│           │   ├── AttendanceHandler.java
│           │   ├── AuthHandler.java
│           │   ├── ReportHandler.java
│           │   ├── StaticFileHandler.java
│           │   ├── StatsHandler.java
│           │   ├── StudentHandler.java
│           │   ├── SubjectHandler.java
│           │   └── TeacherHandler.java
│           ├── model/                # Entity models
│           │   ├── Admin.java
│           │   ├── AttendanceRecord.java
│           │   ├── Student.java
│           │   ├── Subject.java
│           │   └── Teacher.java
│           └── util/
│               ├── HttpUtils.java    # HTTP exchange, CORS, and query helpers
│               └── JsonUtils.java    # Pure Java JSON serializer/parser
├── web/
│   ├── index.html            # Unified login & landing page
│   ├── admin.html            # Administrator portal
│   ├── teacher.html          # Teacher attendance portal
│   ├── student.html          # Student dashboard & analytics
│   ├── css/
│   │   ├── auth.css          # Login page styling
│   │   ├── dashboard.css     # Portals, charts, & table styles
│   │   └── style.css         # Design system, components, & variables
│   └── js/
│       ├── admin.js          # Admin CRUD & reports logic
│       ├── app.js            # Global API client, session, & toasts
│       ├── login.js          # Authentication controller
│       ├── student.js        # Student analytics & target calculator
│       └── teacher.js        # Attendance sheet taker & modifier
├── build.bat                 # Windows compilation script
├── run.bat                   # Windows execution script
└── start.ps1                 # PowerShell build & run script
```

---

## 🌐 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | `POST` | Authenticates Admin, Teacher, or Student |
| `/api/auth/change-password` | `POST` | Updates password for a given user role |
| `/api/stats/dashboard` | `GET` | Returns system-wide statistics for the admin dashboard |
| `/api/students` | `GET`, `POST` | Fetch filtered student list or create student |
| `/api/students/{id}` | `GET`, `PUT`, `DELETE` | View, edit, or delete student |
| `/api/teachers` | `GET`, `POST` | Fetch teacher list or register teacher |
| `/api/teachers/{id}` | `GET`, `PUT`, `DELETE` | View, edit, or delete teacher |
| `/api/subjects` | `GET`, `POST` | Fetch subject list or add subject |
| `/api/subjects/{id}` | `GET`, `PUT`, `DELETE` | View, edit, or delete subject |
| `/api/attendance` | `GET`, `POST` | Query attendance records or mark single record |
| `/api/attendance/bulk` | `POST` | Bulk save attendance for a class session |
| `/api/attendance/{id}` | `PUT`, `DELETE` | Modify attendance status or delete record |
| `/api/reports/student` | `GET` | Student-specific subject breakdown & percentage |
| `/api/reports/subject` | `GET` | Subject-wide student attendance breakdown |
| `/api/reports/overall` | `GET` | System-wide attendance summary |
