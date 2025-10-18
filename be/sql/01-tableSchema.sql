-- Use the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEACHERS
CREATE TABLE teachers (
    teacher_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_name      VARCHAR(100) NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    resetPasswordCode CHAR(6),
    codeExpiryTime    TIMESTAMP,
    hashed_password   TEXT NOT NULL
);

-- EMAIL VERIFICATION CODE
CREATE TABLE emailVerificationCode (
    email         VARCHAR(100) PRIMARY KEY,
    code          CHAR(6) NOT NULL,
    expiryTime    TIMESTAMP NOT NULL
);

-- CLASSROOMS
CREATE TABLE classrooms (
    classroom_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id        UUID NOT NULL,
    classroom_name    VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classroom_teacher FOREIGN KEY (teacher_id)
        REFERENCES teachers (teacher_id) ON DELETE CASCADE
);

-- STUDENTS
CREATE TABLE students (
    rollno            VARCHAR(10) PRIMARY KEY,
    classroom_id      UUID NOT NULL,
    student_name      VARCHAR(100) NOT NULL,
    dob               DATE NOT NULL,
    grade             INT NOT NULL,
    CONSTRAINT fk_student_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id) ON DELETE CASCADE
);

-- SUBJECTS
CREATE TABLE subjects (
    subject_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id      UUID NOT NULL,
    subject_name      VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subject_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id) ON DELETE CASCADE
);

-- ACTIVITY
CREATE TABLE activity (
    activity_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id        UUID NOT NULL,
    title             VARCHAR(255) NOT NULL,
    type              VARCHAR(50) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_subject FOREIGN KEY (subject_id)
        REFERENCES subjects (subject_id) ON DELETE CASCADE
);

-- FILES
CREATE TABLE files (
    file_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minio_path        TEXT NOT NULL,
    activity_id       UUID NOT NULL,
    CONSTRAINT fk_files_activity FOREIGN KEY (activity_id)
        REFERENCES activity (activity_id) ON DELETE CASCADE
);

-- PERFORMANCE (Composite Primary Key)
CREATE TABLE performance (
    student_rollno    VARCHAR(10) NOT NULL,
    activity_id       UUID NOT NULL,
    teacher_feedback  TEXT,
    teacher_mark      INT NOT NULL,
    PRIMARY KEY (student_rollno, activity_id),
    CONSTRAINT fk_performance_student FOREIGN KEY (student_rollno)
        REFERENCES students (rollno) ON DELETE CASCADE,
    CONSTRAINT fk_performance_activity FOREIGN KEY (activity_id)
        REFERENCES activity (activity_id) ON DELETE CASCADE
);

