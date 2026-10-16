package com.sams.handlers;

import com.sams.dao.AttendanceDao;
import com.sams.dao.StudentDao;
import com.sams.model.Student;
import com.sams.util.HttpUtils;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportHandler implements HttpHandler {

    private final AttendanceDao attendanceDao = new AttendanceDao();
    private final StudentDao studentDao = new StudentDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtils.handlePreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = HttpUtils.parseQueryParams(exchange);

        try {
            if (path.contains("/student")) {
                handleStudentReport(exchange, query);
            } else if (path.contains("/subject")) {
                handleSubjectReport(exchange, query);
            } else {
                handleOverallReport(exchange, query);
            }
        } catch (Exception e) {
            e.printStackTrace();
            HttpUtils.sendErrorResponse(exchange, 500, "Error generating report: " + e.getMessage());
        }
    }

    private void handleStudentReport(HttpExchange exchange, Map<String, String> query) throws IOException {
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

        List<Map<String, Object>> subjectBreakdown = attendanceDao.getStudentReport(studentId);
        Map<String, Object> overview = attendanceDao.getStudentOverview(studentId);

        Map<String, Object> resp = new HashMap<>();
        resp.put("student", student);
        resp.put("overview", overview);
        resp.put("breakdown", subjectBreakdown);

        HttpUtils.sendSuccessResponse(exchange, "Student attendance report", resp);
    }

    private void handleSubjectReport(HttpExchange exchange, Map<String, String> query) throws IOException {
        Integer subjectId = null;
        if (query.get("subjectId") != null && !query.get("subjectId").isEmpty()) {
            subjectId = Integer.parseInt(query.get("subjectId"));
        }

        List<Map<String, Object>> list = attendanceDao.getSubjectWiseAggregates(subjectId);
        HttpUtils.sendSuccessResponse(exchange, "Subject attendance report", list);
    }

    private void handleOverallReport(HttpExchange exchange, Map<String, String> query) throws IOException {
        List<Map<String, Object>> list = attendanceDao.getSubjectWiseAggregates(null);
        HttpUtils.sendSuccessResponse(exchange, "Overall attendance report", list);
    }
}
