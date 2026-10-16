package com.sams.dao;

import com.sams.config.DbConfig;
import com.sams.model.Admin;
import java.sql.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class AdminDao {

    public Admin login(String username, String password) {
        String sql = "SELECT admin_id, username, password FROM admin WHERE username = ? AND password = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Admin(
                        rs.getInt("admin_id"),
                        rs.getString("username"),
                        rs.getString("password")
                    );
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean changePassword(int adminId, String newPassword) {
        String sql = "UPDATE admin SET password = ? WHERE admin_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPassword);
            ps.setInt(2, adminId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        String today = LocalDate.now().toString();

        try (Connection conn = DbConfig.getConnection()) {
            // Count students
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM students")) {
                if (rs.next()) stats.put("totalStudents", rs.getInt(1));
            }

            // Count teachers
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM teachers")) {
                if (rs.next()) stats.put("totalTeachers", rs.getInt(1));
            }

            // Count subjects
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM subjects")) {
                if (rs.next()) stats.put("totalSubjects", rs.getInt(1));
            }

            // Attendance today
            String todaySql = "SELECT COUNT(*) AS total, " +
                "SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present, " +
                "SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent " +
                "FROM attendance WHERE attendance_date = ?";
            try (PreparedStatement ps = conn.prepareStatement(todaySql)) {
                ps.setString(1, today);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int total = rs.getInt("total");
                        int present = rs.getInt("present");
                        int absent = rs.getInt("absent");
                        stats.put("todayMarked", total);
                        stats.put("todayPresent", present);
                        stats.put("todayAbsent", absent);
                        double rate = total > 0 ? (present * 100.0 / total) : 0.0;
                        stats.put("todayAttendanceRate", Math.round(rate * 10.0) / 10.0);
                    }
                }
            }

            // Overall attendance count
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*), SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) FROM attendance")) {
                if (rs.next()) {
                    int allTotal = rs.getInt(1);
                    int allPresent = rs.getInt(2);
                    stats.put("allTimeRecords", allTotal);
                    double allRate = allTotal > 0 ? (allPresent * 100.0 / allTotal) : 0.0;
                    stats.put("overallAttendanceRate", Math.round(allRate * 10.0) / 10.0);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return stats;
    }
}
