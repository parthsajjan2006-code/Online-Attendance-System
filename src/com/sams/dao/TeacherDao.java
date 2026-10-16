package com.sams.dao;

import com.sams.config.DbConfig;
import com.sams.model.Teacher;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TeacherDao {

    public Teacher login(String username, String password) {
        String sql = "SELECT teacher_id, name, email, username, password FROM teachers WHERE username = ? AND password = ?";
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

    public List<Teacher> getAll() {
        List<Teacher> list = new ArrayList<>();
        String sql = "SELECT teacher_id, name, email, username, password FROM teachers ORDER BY teacher_id ASC";
        try (Connection conn = DbConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Teacher getById(int id) {
        String sql = "SELECT teacher_id, name, email, username, password FROM teachers WHERE teacher_id = ?";
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

    public boolean create(Teacher t) {
        String sql = "INSERT INTO teachers (name, email, username, password) VALUES (?, ?, ?, ?)";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, t.getName());
            ps.setString(2, t.getEmail());
            ps.setString(3, t.getUsername());
            ps.setString(4, t.getPassword());
            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet gk = ps.getGeneratedKeys()) {
                    if (gk.next()) {
                        t.setTeacherId(gk.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean update(Teacher t) {
        StringBuilder sql = new StringBuilder("UPDATE teachers SET name = ?, email = ?, username = ?");
        boolean updatePass = t.getPassword() != null && !t.getPassword().trim().isEmpty();
        if (updatePass) {
            sql.append(", password = ?");
        }
        sql.append(" WHERE teacher_id = ?");

        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            ps.setString(1, t.getName());
            ps.setString(2, t.getEmail());
            ps.setString(3, t.getUsername());
            int idx = 4;
            if (updatePass) {
                ps.setString(idx++, t.getPassword());
            }
            ps.setInt(idx, t.getTeacherId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean delete(int id) {
        String sql = "DELETE FROM teachers WHERE teacher_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean changePassword(int teacherId, String newPassword) {
        String sql = "UPDATE teachers SET password = ? WHERE teacher_id = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPassword);
            ps.setInt(2, teacherId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private Teacher mapRow(ResultSet rs) throws SQLException {
        return new Teacher(
            rs.getInt("teacher_id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("username"),
            rs.getString("password")
        );
    }
}
