package com.sams.handlers;

import com.sams.dao.AdminDao;
import com.sams.dao.StudentDao;
import com.sams.dao.TeacherDao;
import com.sams.model.Admin;
import com.sams.model.Student;
import com.sams.model.Teacher;
import com.sams.util.HttpUtils;
import com.sams.util.JsonUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class AuthHandler implements HttpHandler {

    private final AdminDao adminDao = new AdminDao();
    private final TeacherDao teacherDao = new TeacherDao();
    private final StudentDao studentDao = new StudentDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if ("POST".equalsIgnoreCase(method)) {
            if (path.endsWith("/login")) {
                handleLogin(exchange);
                return;
            } else if (path.endsWith("/change-password")) {
                handleChangePassword(exchange);
                return;
            }
        }

        HttpUtils.sendErrorResponse(exchange, 404, "Endpoint not found");
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        String role = String.valueOf(req.getOrDefault("role", "")).trim().toLowerCase();
        String username = String.valueOf(req.getOrDefault("username", "")).trim();
        String password = String.valueOf(req.getOrDefault("password", "")).trim();

        if (username.isEmpty() || password.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Username and password are required");
            return;
        }

        Map<String, Object> user = new HashMap<>();

        if ("admin".equals(role)) {
            Admin admin = adminDao.login(username, password);
            if (admin != null) {
                user.put("id", admin.getAdminId());
                user.put("username", admin.getUsername());
                user.put("name", "Administrator");
                user.put("role", "admin");
                HttpUtils.sendSuccessResponse(exchange, "Admin login successful", user);
                return;
            }
        } else if ("teacher".equals(role)) {
            Teacher teacher = teacherDao.login(username, password);
            if (teacher != null) {
                user.put("id", teacher.getTeacherId());
                user.put("username", teacher.getUsername());
                user.put("name", teacher.getName());
                user.put("email", teacher.getEmail());
                user.put("role", "teacher");
                HttpUtils.sendSuccessResponse(exchange, "Teacher login successful", user);
                return;
            }
        } else if ("student".equals(role)) {
            Student student = studentDao.login(username, password);
            if (student != null) {
                user.put("id", student.getStudentId());
                user.put("username", student.getUsername());
                user.put("name", student.getName());
                user.put("email", student.getEmail());
                user.put("course", student.getCourse());
                user.put("semester", student.getSemester());
                user.put("role", "student");
                HttpUtils.sendSuccessResponse(exchange, "Student login successful", user);
                return;
            }
        } else {
            HttpUtils.sendErrorResponse(exchange, 400, "Invalid role specified: " + role);
            return;
        }

        HttpUtils.sendErrorResponse(exchange, 401, "Invalid username or password");
    }

    private void handleChangePassword(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        String role = String.valueOf(req.getOrDefault("role", "")).trim().toLowerCase();
        int userId = req.get("userId") != null ? Integer.parseInt(req.get("userId").toString()) : 0;
        String newPassword = String.valueOf(req.getOrDefault("newPassword", "")).trim();

        if (userId <= 0 || newPassword.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "User ID and new password are required");
            return;
        }

        boolean success = false;
        if ("admin".equals(role)) {
            success = adminDao.changePassword(userId, newPassword);
        } else if ("teacher".equals(role)) {
            success = teacherDao.changePassword(userId, newPassword);
        } else if ("student".equals(role)) {
            success = studentDao.changePassword(userId, newPassword);
        }

        if (success) {
            HttpUtils.sendSuccessResponse(exchange, "Password updated successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to update password");
        }
    }
}
