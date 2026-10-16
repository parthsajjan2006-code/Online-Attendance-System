package com.sams.handlers;

import com.sams.dao.TeacherDao;
import com.sams.model.Teacher;
import com.sams.util.HttpUtils;
import com.sams.util.JsonUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class TeacherHandler implements HttpHandler {

    private final TeacherDao teacherDao = new TeacherDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = HttpUtils.parseQueryParams(exchange);

        try {
            switch (method.toUpperCase()) {
                case "GET" -> handleGet(exchange, path);
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

    private void handleGet(HttpExchange exchange, String path) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id != null) {
            Teacher t = teacherDao.getById(id);
            if (t != null) {
                HttpUtils.sendSuccessResponse(exchange, "Teacher found", t);
            } else {
                HttpUtils.sendErrorResponse(exchange, 404, "Teacher not found");
            }
            return;
        }

        List<Teacher> list = teacherDao.getAll();
        HttpUtils.sendSuccessResponse(exchange, "Teachers retrieved", list);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        String name = String.valueOf(req.getOrDefault("name", "")).trim();
        String email = String.valueOf(req.getOrDefault("email", "")).trim();
        String username = String.valueOf(req.getOrDefault("username", "")).trim();
        String password = String.valueOf(req.getOrDefault("password", "")).trim();

        if (name.isEmpty() || username.isEmpty() || password.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Name, username, and password are required");
            return;
        }

        Teacher t = new Teacher(0, name, email, username, password);
        if (teacherDao.create(t)) {
            HttpUtils.sendSuccessResponse(exchange, "Teacher registered successfully", t);
        } else {
            HttpUtils.sendErrorResponse(exchange, 400, "Failed to register teacher. Username might already exist.");
        }
    }

    private void handlePut(HttpExchange exchange, String path) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        Integer id = extractIdFromPath(path);
        if (id == null && req.get("teacherId") != null) {
            id = Integer.parseInt(req.get("teacherId").toString());
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Teacher ID is required");
            return;
        }

        Teacher t = teacherDao.getById(id);
        if (t == null) {
            HttpUtils.sendErrorResponse(exchange, 404, "Teacher not found");
            return;
        }

        if (req.containsKey("name")) t.setName(String.valueOf(req.get("name")));
        if (req.containsKey("email")) t.setEmail(String.valueOf(req.get("email")));
        if (req.containsKey("username")) t.setUsername(String.valueOf(req.get("username")));
        if (req.containsKey("password") && !String.valueOf(req.get("password")).isEmpty()) {
            t.setPassword(String.valueOf(req.get("password")));
        }

        if (teacherDao.update(t)) {
            HttpUtils.sendSuccessResponse(exchange, "Teacher updated successfully", t);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to update teacher");
        }
    }

    private void handleDelete(HttpExchange exchange, String path, Map<String, String> query) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id == null && query.containsKey("id")) {
            id = Integer.parseInt(query.get("id"));
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Teacher ID is required");
            return;
        }

        if (teacherDao.delete(id)) {
            HttpUtils.sendSuccessResponse(exchange, "Teacher deleted successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to delete teacher");
        }
    }

    private Integer extractIdFromPath(String path) {
        String prefix = "/api/teachers/";
        if (path.startsWith(prefix) && path.length() > prefix.length()) {
            try {
                return Integer.parseInt(path.substring(prefix.length()).replaceAll("/.*", ""));
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
