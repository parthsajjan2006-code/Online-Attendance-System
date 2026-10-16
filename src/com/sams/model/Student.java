package com.sams.model;

public class Student {
    private int studentId;
    private String name;
    private String email;
    private String course;
    private int semester;
    private String username;
    private String password;

    public Student() {}

    public Student(int studentId, String name, String email, String course, int semester, String username, String password) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.course = course;
        this.semester = semester;
        this.username = username;
        this.password = password;
    }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
