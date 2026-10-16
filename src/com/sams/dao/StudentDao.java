package com.sams.dao;

import com.sams.config.DbConfig;
import com.sams.model.Student;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class StudentDao {

    public Student login(String username, String password) {
        String sql = "SELECT student_id, name, email, course, semester, username, password FROM students WHERE username = ? AND password = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Student> getAll(String search, String course, Integer semester) {
        List<Student> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT student_id, name, email, course, semester, username, password FROM students WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (name LIKE ? OR username LIKE ? OR email LIKE ?)");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
        if (course != null && !course.trim().isEmpty()) {
            sql.append(" AND course = ?");
            params.add(course.trim());
        }
        if (semester != null && semester > 0) {
            sql.append(" AND semester = ?");
            params.add(semester);
        }

        sql.append(" ORDER BY student_id ASC");

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Student getById(int id) {
        String sql = "SELECT student_id, name, email, course, semester, username, password FROM students WHERE student_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Student getByUsername(String username) {
        String sql = "SELECT student_id, name, email, course, semester, username, password FROM students WHERE username = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean create(Student s) {
        String sql = "INSERT INTO students (name, email, course, semester, username, password) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getName());
            ps.setString(2, s.getEmail());
            ps.setString(3, s.getCourse());
            ps.setInt(4, s.getSemester());
            ps.setString(5, s.getUsername());
            ps.setString(6, s.getPassword());
            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet gk = ps.getGeneratedKeys()) {
                    if (gk.next()) {
                        s.setStudentId(gk.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean update(Student s) {
        StringBuilder sql = new StringBuilder("UPDATE students SET name = ?, email = ?, course = ?, semester = ?, username = ?");
        boolean updatePass = s.getPassword() != null && !s.getPassword().trim().isEmpty();
        if (updatePass) {
            sql.append(", password = ?");
        }
        sql.append(" WHERE student_id = ?");

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            ps.setString(1, s.getName());
            ps.setString(2, s.getEmail());
            ps.setString(3, s.getCourse());
            ps.setInt(4, s.getSemester());
            ps.setString(5, s.getUsername());
            int idx = 6;
            if (updatePass) {
                ps.setString(idx++, s.getPassword());
            }
            ps.setInt(idx, s.getStudentId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean delete(int id) {
        String sql = "DELETE FROM students WHERE student_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean changePassword(int studentId, String newPassword) {
        String sql = "UPDATE students SET password = ? WHERE student_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPassword);
            ps.setInt(2, studentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private Student mapRow(ResultSet rs) throws SQLException {
        return new Student(
            rs.getInt("student_id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("course"),
            rs.getInt("semester"),
            rs.getString("username"),
            rs.getString("password")
        );
    }
}
