package com.sams.dao;

import com.sams.config.DbConfig;
import com.sams.model.AttendanceRecord;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;

public class AttendanceDao {

    public boolean markAttendance(int studentId, int subjectId, String date, String status) {
        String sql = """
            INSERT INTO attendance (student_id, subject_id, attendance_date, status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setInt(2, subjectId);
            ps.setDate(3, java.sql.Date.valueOf(date));
            ps.setString(4, status);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public int markBulkAttendance(int subjectId, String date, List<Map<String, Object>> records) {
        String sql = """
            INSERT INTO attendance (student_id, subject_id, attendance_date, status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        """;
        int count = 0;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);
            for (Map<String, Object> r : records) {
                int studentId = Integer.parseInt(r.get("studentId").toString());
                String status = String.valueOf(r.get("status"));
                ps.setInt(1, studentId);
                ps.setInt(2, subjectId);
                ps.setDate(3, java.sql.Date.valueOf(date));
                ps.setString(4, status);
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            conn.commit();
            for (int res : results) {
                if (res >= 0 || res == Statement.SUCCESS_NO_INFO) count++;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return count;
    }

    public boolean updateStatus(int attendanceId, String status) {
        String sql = "UPDATE attendance SET status = ? WHERE attendance_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, attendanceId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean delete(int attendanceId) {
        String sql = "DELETE FROM attendance WHERE attendance_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, attendanceId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Map<String, Object>> getRecords(Integer studentId, Integer subjectId, String date, String fromDate, String toDate) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT a.attendance_id, a.student_id, s.name AS student_name, s.course, s.semester,
                   a.subject_id, sub.subject_name, a.attendance_date, a.status
            FROM attendance a
            JOIN students s ON a.student_id = s.student_id
            JOIN subjects sub ON a.subject_id = sub.subject_id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (studentId != null && studentId > 0) {
            sql.append(" AND a.student_id = ?");
            params.add(studentId);
        }
        if (subjectId != null && subjectId > 0) {
            sql.append(" AND a.subject_id = ?");
            params.add(subjectId);
        }
        if (date != null && !date.trim().isEmpty()) {
            sql.append(" AND a.attendance_date = ?");
            params.add(date.trim());
        }
        if (fromDate != null && !fromDate.trim().isEmpty()) {
            sql.append(" AND a.attendance_date >= ?");
            params.add(fromDate.trim());
        }
        if (toDate != null && !toDate.trim().isEmpty()) {
            sql.append(" AND a.attendance_date <= ?");
            params.add(toDate.trim());
        }

        sql.append(" ORDER BY a.attendance_date DESC, s.name ASC");

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("attendanceId", rs.getInt("attendance_id"));
                    map.put("studentId", rs.getInt("student_id"));
                    map.put("studentName", rs.getString("student_name"));
                    map.put("course", rs.getString("course"));
                    map.put("semester", rs.getInt("semester"));
                    map.put("subjectId", rs.getInt("subject_id"));
                    map.put("subjectName", rs.getString("subject_name"));
                    map.put("attendanceDate", rs.getString("attendance_date"));
                    map.put("status", rs.getString("status"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getStudentReport(int studentId) {
        List<Map<String, Object>> reports = new ArrayList<>();
        String sql = """
            SELECT sub.subject_id, sub.subject_name,
                   COUNT(a.attendance_id) AS total_classes,
                   SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
                   SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_classes
            FROM attendance a
            JOIN subjects sub ON a.subject_id = sub.subject_id
            WHERE a.student_id = ?
            GROUP BY sub.subject_id, sub.subject_name
            ORDER BY sub.subject_name ASC
        """;

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int total = rs.getInt("total_classes");
                    int present = rs.getInt("present_classes");
                    int absent = rs.getInt("absent_classes");
                    double pct = total > 0 ? (present * 100.0 / total) : 0.0;

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("subjectId", rs.getInt("subject_id"));
                    item.put("subjectName", rs.getString("subject_name"));
                    item.put("totalClasses", total);
                    item.put("presentClasses", present);
                    item.put("absentClasses", absent);
                    item.put("percentage", Math.round(pct * 10.0) / 10.0);
                    item.put("statusLabel", pct >= 75 ? "Good" : (pct >= 60 ? "Warning" : "Critical"));
                    reports.add(item);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return reports;
    }

    public Map<String, Object> getStudentOverview(int studentId) {
        Map<String, Object> overview = new LinkedHashMap<>();
        String sql = """
            SELECT COUNT(a.attendance_id) AS total_classes,
                   SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
                   SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_classes
            FROM attendance a
            WHERE a.student_id = ?
        """;

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int total = rs.getInt("total_classes");
                    int present = rs.getInt("present_classes");
                    int absent = rs.getInt("absent_classes");
                    double pct = total > 0 ? (present * 100.0 / total) : 0.0;
                    overview.put("totalClasses", total);
                    overview.put("presentClasses", present);
                    overview.put("absentClasses", absent);
                    overview.put("percentage", Math.round(pct * 10.0) / 10.0);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return overview;
    }

    public List<Map<String, Object>> getSubjectWiseAggregates(Integer subjectId) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT s.student_id, s.name AS student_name, s.course, s.semester,
                   sub.subject_id, sub.subject_name,
                   COUNT(a.attendance_id) AS total_classes,
                   SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
                   SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_classes
            FROM attendance a
            JOIN students s ON a.student_id = s.student_id
            JOIN subjects sub ON a.subject_id = sub.subject_id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();
        if (subjectId != null && subjectId > 0) {
            sql.append(" AND a.subject_id = ?");
            params.add(subjectId);
        }
        sql.append(" GROUP BY s.student_id, s.name, s.course, s.semester, sub.subject_id, sub.subject_name ORDER BY s.name ASC");

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int total = rs.getInt("total_classes");
                    int present = rs.getInt("present_classes");
                    int absent = rs.getInt("absent_classes");
                    double pct = total > 0 ? (present * 100.0 / total) : 0.0;

                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("studentId", rs.getInt("student_id"));
                    map.put("studentName", rs.getString("student_name"));
                    map.put("course", rs.getString("course"));
                    map.put("semester", rs.getInt("semester"));
                    map.put("subjectId", rs.getInt("subject_id"));
                    map.put("subjectName", rs.getString("subject_name"));
                    map.put("totalClasses", total);
                    map.put("presentClasses", present);
                    map.put("absentClasses", absent);
                    map.put("percentage", Math.round(pct * 10.0) / 10.0);
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
