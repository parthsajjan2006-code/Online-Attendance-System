package com.sams.handlers;

import com.sams.dao.AttendanceDao;
import com.sams.util.HttpUtils;
import com.sams.util.JsonUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class AttendanceHandler implements HttpHandler {

    private final AttendanceDao attendanceDao = new AttendanceDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = HttpUtils.parseQueryParams(exchange);

        try {
            switch (method.toUpperCase()) {
                case "GET" -> handleGet(exchange, query);
                case "POST" -> {
                    if (path.endsWith("/bulk")) {
                        handleBulkPost(exchange);
                    } else {
                        handlePost(exchange);
                    }
                }
                case "PUT" -> handlePut(exchange, path);
                case "DELETE" -> handleDelete(exchange, path, query);
                default -> HttpUtils.sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            e.printStackTrace();
            HttpUtils.sendErrorResponse(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    private void handleGet(HttpExchange exchange, Map<String, String> query) throws IOException {
        Integer studentId = null;
        Integer subjectId = null;
        String date = query.get("date");
        String fromDate = query.get("fromDate");
        String toDate = query.get("toDate");

        if (query.get("studentId") != null && !query.get("studentId").isEmpty()) {
            try { studentId = Integer.parseInt(query.get("studentId")); } catch (NumberFormatException ignored) {}
        }
        if (query.get("subjectId") != null && !query.get("subjectId").isEmpty()) {
            try { subjectId = Integer.parseInt(query.get("subjectId")); } catch (NumberFormatException ignored) {}
        }

        List<Map<String, Object>> records = attendanceDao.getRecords(studentId, subjectId, date, fromDate, toDate);
        HttpUtils.sendSuccessResponse(exchange, "Attendance records retrieved", records);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        int studentId = req.get("studentId") != null ? Integer.parseInt(req.get("studentId").toString()) : 0;
        int subjectId = req.get("subjectId") != null ? Integer.parseInt(req.get("subjectId").toString()) : 0;
        String date = req.get("attendanceDate") != null ? req.get("attendanceDate").toString() : LocalDate.now().toString();
        String status = req.get("status") != null ? req.get("status").toString().trim() : "Present";

        if (studentId <= 0 || subjectId <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Student ID and Subject ID are required");
            return;
        }

        // Normalize status
        if (!status.equalsIgnoreCase("Present") && !status.equalsIgnoreCase("Absent") && !status.equalsIgnoreCase("Late")) {
            status = "Present";
        }
        status = status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();

        boolean ok = attendanceDao.markAttendance(studentId, subjectId, date, status);
        if (ok) {
            HttpUtils.sendSuccessResponse(exchange, "Attendance recorded successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to record attendance");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleBulkPost(HttpExchange exchange) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        int subjectId = req.get("subjectId") != null ? Integer.parseInt(req.get("subjectId").toString()) : 0;
        String date = req.get("attendanceDate") != null ? req.get("attendanceDate").toString() : LocalDate.now().toString();
        List<Map<String, Object>> records = (List<Map<String, Object>>) (List<?>) req.get("records");

        if (subjectId <= 0 || records == null || records.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Subject ID and records list are required");
            return;
        }

        int count = attendanceDao.markBulkAttendance(subjectId, date, records);
        HttpUtils.sendSuccessResponse(exchange, "Attendance saved for " + count + " students", Map.of("count", count));
    }

    private void handlePut(HttpExchange exchange, String path) throws IOException {
        String body = HttpUtils.readRequestBody(exchange);
        Map<String, Object> req = JsonUtils.parseObject(body);

        Integer id = extractIdFromPath(path);
        if (id == null && req.get("attendanceId") != null) {
            id = Integer.parseInt(req.get("attendanceId").toString());
        }

        String status = req.get("status") != null ? req.get("status").toString().trim() : "";
        if (id == null || id <= 0 || status.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "Attendance ID and status are required");
            return;
        }

        status = status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
        if (attendanceDao.updateStatus(id, status)) {
            HttpUtils.sendSuccessResponse(exchange, "Attendance updated successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to update attendance");
        }
    }

    private void handleDelete(HttpExchange exchange, String path, Map<String, String> query) throws IOException {
        Integer id = extractIdFromPath(path);
        if (id == null && query.containsKey("id")) {
            id = Integer.parseInt(query.get("id"));
        }

        if (id == null || id <= 0) {
            HttpUtils.sendErrorResponse(exchange, 400, "Attendance ID is required");
            return;
        }

        if (attendanceDao.delete(id)) {
            HttpUtils.sendSuccessResponse(exchange, "Attendance deleted successfully", null);
        } else {
            HttpUtils.sendErrorResponse(exchange, 500, "Failed to delete attendance");
        }
    }

    private Integer extractIdFromPath(String path) {
        String prefix = "/api/attendance/";
        if (path.startsWith(prefix) && path.length() > prefix.length()) {
            try {
                String sub = path.substring(prefix.length()).replaceAll("/.*", "");
                if (!sub.equalsIgnoreCase("bulk")) {
                    return Integer.parseInt(sub);
                }
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
