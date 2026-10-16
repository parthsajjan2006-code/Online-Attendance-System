package com.sams.handlers;

import com.sams.dao.AdminDao;
import com.sams.dao.AttendanceDao;
import com.sams.dao.StudentDao;
import com.sams.model.Student;
import com.sams.util.HttpUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class StatsHandler implements HttpHandler {

    private final AdminDao adminDao = new AdminDao();
    private final AttendanceDao attendanceDao = new AttendanceDao();
    private final StudentDao studentDao = new StudentDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = HttpUtils.parseQueryParams(exchange);

        try {
            if (path.contains("/student")) {
                handleStudentStats(exchange, query);
            } else {
                handleGeneralStats(exchange);
            }
        } catch (Exception e) {
            e.printStackTrace();
            HttpUtils.sendErrorResponse(exchange, 500, "Error getting stats: " + e.getMessage());
        }
    }

    private void handleGeneralStats(HttpExchange exchange) throws IOException {
        Map<String, Object> stats = adminDao.getDashboardStats();
        HttpUtils.sendSuccessResponse(exchange, "Dashboard statistics", stats);
    }

    private void handleStudentStats(HttpExchange exchange, Map<String, String> query) throws IOException {
        String studentIdStr = query.get("studentId");
        if (studentIdStr == null || studentIdStr.isEmpty()) {
            HttpUtils.sendErrorResponse(exchange, 400, "studentId parameter is required");
            return;
        }

        int studentId = Integer.parseInt(studentIdStr);
        Student student = studentDao.getById(studentId);
        if (student == null) {
            HttpUtils.sendErrorResponse(exchange, 404, "Student not found");
            return;
        }

        Map<String, Object> overview = attendanceDao.getStudentOverview(studentId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("student", student);
        resp.put("stats", overview);
        resp.put("recentLogs", attendanceDao.getRecords(studentId, null, null, null, null));

        HttpUtils.sendSuccessResponse(exchange, "Student dashboard stats", resp);
    }
}
