package com.sams;

import com.sams.config.DbConfig;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting Online SAMS Backend Application...");

        // 1. Initialize and test database
        DbConfig.initDatabase();

        // 2. Start HTTP Server
        try {
            Server server = new Server();
            server.start();

            // Keep alive
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Shutting down server...");
                server.stop();
            }));

        } catch (Exception e) {
            System.err.println("Fatal Error: Could not start web server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
