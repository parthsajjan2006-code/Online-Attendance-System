package com.sams.handlers;

import com.sams.dao.SubjectDao;
import com.sams.model.Subject;
import com.sams.util.HttpUtils;
import com.sams.util.JsonUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class SubjectHandler implements HttpHandler {

    private final SubjectDao subjectDao = new SubjectDao();

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
            Subject s = subjectDao.getById(id);
            if (s != null) {
                HttpUtils.sendSuccessResponse(exchange, "Subject found", s);
            } else {
                HttpUtils.sendErrorResponse(exchange, 404, "Subject not found");
            }
            return;
        }

        List<Subject> list = subjectDao.getAll();
        HttpUtils.sendSuccessResponse(exchange, "Subjects retrieved", list);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        String subjectName = String.valueOf(req.getOrDefault("subjectName", "")).trim();
        if (subjectName.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Subject name is required");
            return;
        }

        Subject s = new Subject(0, subjectName);
        if (subjectDao.create(s)) {
            HttpUtils.sendSuccessResponse(exchange, "Subject created successfully", s);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to create subject");
        }
    }

    private void handlePut(HttpExchange exchange, String path) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        Integer id = extractIdFromPath(path);
        if (id == null && req.get("subjectId") != null) {
            id = Integer.parseInt(req.get("subjectId").toString());
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Subject ID is required");
            return;
        }

        Subject s = subjectDao.getById(id);
        if (s == null) {
            HttpUtils.sendErrorResponse(exchange, 404, "Subject not found");
            return;
        }

        if (req.containsKey("subjectName")) {
            s.setSubjectName(String.valueOf(req.get("subjectName")).trim());
        }

        if (subjectDao.update(s)) {
            HttpUtils.sendSuccessResponse(exchange, "Subject updated successfully", s);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to update subject");
        }
    }

    private void handleDelete(HttpExchange exchange, String path, Map<String, String> query) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id == null && query.containsKey("id")) {
            id = Integer.parseInt(query.get("id"));
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Subject ID is required");
            return;
        }

        if (subjectDao.delete(id)) {
            HttpUtils.sendSuccessResponse(exchange, "Subject deleted successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to delete subject");
        }
    }

    private Integer extractIdFromPath(String path) {
        String prefix = "/api/subjects/";
        if (path.startsWith(prefix) && path.length() > prefix.length()) {
            try {
                return Integer.parseInt(path.substring(prefix.length()).replaceAll("/.*", ""));
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
