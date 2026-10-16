package com.sams.handlers;

import com.sams.dao.StudentDao;
import com.sams.model.Student;
import com.sams.util.HttpUtils;
import com.sams.util.JsonUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class StudentHandler implements HttpHandler {

    private final StudentDao studentDao = new StudentDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = HttpUtils.parseQueryParams(exchange);

        try {
            switch (method.toUpperCase()) {
                case "GET" -> handleGet(exchange, path, query);
                case "POST" -> handlePost(exchange);
                case "PUT" -> handlePut(exchange, path);
                case "DELETE" -> handleDelete(exchange, path, query);
                default -> HttpUtils.sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            e.printStackTrace();
            HttpUtils.sendErrorResponse(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    private void handleGet(HttpExchange exchange, String path, Map<String, String> query) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id != null) {
            Student s = studentDao.getById(id);
            if (s != null) {
                HttpUtils.sendSuccessResponse(exchange, "Student found", s);
            } else {
                HttpUtils.sendErrorResponse(exchange, 404, "Student not found");
            }
            return;
        }

        String search = query.get("search");
        String course = query.get("course");
        Integer sem = null;
        if (query.get("semester") != null && !query.get("semester").isEmpty()) {
            try { sem = Integer.parseInt(query.get("semester")); } catch (NumberFormatException ignored) {}
        }

        List<Student> list = studentDao.getAll(search, course, sem);
        HttpUtils.sendSuccessResponse(exchange, "Students retrieved", list);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        String name = String.valueOf(req.getOrDefault("name", "")).trim();
        String email = String.valueOf(req.getOrDefault("email", "")).trim();
        String course = String.valueOf(req.getOrDefault("course", "")).trim();
        int semester = req.get("semester") != null ? Integer.parseInt(req.get("semester").toString()) : 1;
        String username = String.valueOf(req.getOrDefault("username", "")).trim();
        String password = String.valueOf(req.getOrDefault("password", "")).trim();

        if (name.isEmpty() || username.isEmpty() || password.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Name, username, and password are required");
            return;
        }

        Student s = new Student(0, name, email, course, semester, username, password);
        if (studentDao.create(s)) {
            HttpUtils.sendSuccessResponse(exchange, "Student registered successfully", s);
        } else {
            HttpUtils.sendErrorResponse(exchange, 400, "Failed to register student. Username might already exist.");
        }
    }

    private void handlePut(HttpExchange exchange, String path) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        Integer id = extractIdFromPath(path);
        if (id == null && req.get("studentId") != null) {
            id = Integer.parseInt(req.get("studentId").toString());
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Student ID is required");
            return;
        }

        Student s = studentDao.getById(id);
        if (s == null) {
            HttpUtils.sendErrorResponse(exchange, 404, "Student not found");
            return;
        }

        if (req.containsKey("name")) s.setName(String.valueOf(req.get("name")));
        if (req.containsKey("email")) s.setEmail(String.valueOf(req.get("email")));
        if (req.containsKey("course")) s.setCourse(String.valueOf(req.get("course")));
        if (req.containsKey("semester")) s.setSemester(Integer.parseInt(req.get("semester").toString()));
        if (req.containsKey("username")) s.setUsername(String.valueOf(req.get("username")));
        if (req.containsKey("password") && !String.valueOf(req.get("password")).isEmpty()) {
            s.setPassword(String.valueOf(req.get("password")));
        }

        if (studentDao.update(s)) {
            HttpUtils.sendSuccessResponse(exchange, "Student updated successfully", s);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to update student");
        }
    }

    private void handleDelete(HttpExchange exchange, String path, Map<String, String> query) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id == null && query.containsKey("id")) {
            id = Integer.parseInt(query.get("id"));
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Student ID is required");
            return;
        }

        if (studentDao.delete(id)) {
            HttpUtils.sendSuccessResponse(exchange, "Student deleted successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to delete student");
        }
    }

    private Integer extractIdFromPath(String path) {
        String prefix = "/api/students/";
        if (path.startsWith(prefix) && path.length() > prefix.length()) {
            try {
                return Integer.parseInt(path.substring(prefix.length()).replaceAll("/.*", ""));
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
