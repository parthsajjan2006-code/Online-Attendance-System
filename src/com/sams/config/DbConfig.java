package com.sams.config;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

public class DbConfig {

    private static String url = "jdbc:mysql://localhost:3306/attendance_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static String username = "root";
    private static String password = "Redhat@123";
    private static int port = 8080;

    static {
        loadProperties();
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL Driver not found in classpath: " + e.getMessage());
        }
    }

    private static void loadProperties() {
        Properties props = new Properties();
        File configFile = new File("config.properties");
        if (configFile.exists()) {
            try (InputStream in = new FileInputStream(configFile)) {
                props.load(in);
                if (props.getProperty("db.url") != null) {
                    url = props.getProperty("db.url");
                }
                if (props.getProperty("db.user") != null) {
                    username = props.getProperty("db.user");
                }
                if (props.getProperty("db.password") != null) {
                    password = props.getProperty("db.password");
                }
                if (props.getProperty("server.port") != null) {
                    try {
                        port = Integer.parseInt(props.getProperty("server.port").trim());
                    } catch (NumberFormatException ignored) {}
                }
            } catch (Exception e) {
                System.err.println("Warning: Could not read config.properties: " + e.getMessage());
            }
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, username, password);
    }

    public static int getServerPort() {
        return port;
    }

    public static void initDatabase() {
        System.out.println("Connecting to MySQL Database at: " + url.split("\\?")[0]);
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            // Verify tables exist or create them
            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS admin (
                    admin_id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(100) NOT NULL
                )
            """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS teachers (
                    teacher_id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(100) NOT NULL
                )
            """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS students (
                    student_id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    course VARCHAR(50),
                    semester INT,
                    username VARCHAR(50) UNIQUE,
                    password VARCHAR(100)
                )
            """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS subjects (
                    subject_id INT PRIMARY KEY AUTO_INCREMENT,
                    subject_name VARCHAR(100) NOT NULL
                )
            """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS attendance (
                    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
                    student_id INT NOT NULL,
                    subject_id INT NOT NULL,
                    attendance_date DATE NOT NULL,
                    status VARCHAR(10) NOT NULL,
                    UNIQUE KEY unique_attendance (student_id, subject_id, attendance_date)
                )
            """);

            // Ensure default admin exists
            stmt.executeUpdate("""
                INSERT INTO admin (username, password)
                SELECT 'admin', 'admin123'
                WHERE NOT EXISTS (SELECT 1 FROM admin WHERE username = 'admin')
            """);

            System.out.println(" Database initialized and verified successfully!");
        } catch (SQLException e) {
            System.err.println(" Failed to initialize database: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
