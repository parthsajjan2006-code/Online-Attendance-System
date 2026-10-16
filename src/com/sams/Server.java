package com.sams;

import com.sams.config.DbConfig;
import com.sams.handlers.*;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.BindException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Server {

    private HttpServer server;
    private int boundPort;

    public void start() throws IOException {
        int port = DbConfig.getServerPort();
        
        while (true) {
            try {
                server = HttpServer.create(new InetSocketAddress(port), 0);
                boundPort = port;
                break;
            } catch (BindException e) {
                System.out.println("Port " + port + " already in use, trying port " + (port + 1) + "...");
                port++;
            }
        }

        // API Contexts
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/students", new StudentHandler());
        server.createContext("/api/teachers", new TeacherHandler());
        server.createContext("/api/subjects", new SubjectHandler());
        server.createContext("/api/attendance", new AttendanceHandler());
        server.createContext("/api/reports", new ReportHandler());
        server.createContext("/api/stats", new StatsHandler());

        // Static files (Web site)
        server.createContext("/", new StaticFileHandler("web"));

        server.setExecutor(Executors.newFixedThreadPool(20));
        server.start();

        System.out.println("==================================================");
        System.out.println(" ONLINE STUDENT ATTENDANCE MANAGEMENT SYSTEM (SAMS)");
        System.out.println("==================================================");
        System.out.println(" Server successfully running!");
        System.out.println(" Web Portal: http://localhost:" + boundPort);
        System.out.println(" Default Admin: admin / admin123");
        System.out.println(" Database: MySQL (attendance_db)");
        System.out.println("==================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            System.out.println("Server stopped.");
        }
    }
}
