-- Use the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_name      VARCHAR(100) NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    resetPasswordCode CHAR(6),
    codeExpiryTime    TIMESTAMP,
    hashed_password   TEXT NOT NULL
);

-- EMAIL VERIFICATION CODE
CREATE TABLE IF NOT EXISTS emailVerificationCode (
    email         VARCHAR(100) PRIMARY KEY,
    code          CHAR(6) NOT NULL,
    expiryTime    TIMESTAMP NOT NULL
);

-- CLASSROOMS
CREATE TABLE IF NOT EXISTS classrooms (
    classroom_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id        UUID NOT NULL,
    classroom_name    VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classroom_teacher FOREIGN KEY (teacher_id)
        REFERENCES teachers (teacher_id) ON DELETE CASCADE
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
    rollno            VARCHAR(10) PRIMARY KEY,
    classroom_id      UUID NOT NULL,
    student_name      VARCHAR(100) NOT NULL,
    dob               DATE NOT NULL,
    grade             INT NOT NULL,
    CONSTRAINT fk_student_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id) ON DELETE CASCADE
);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    subject_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id      UUID NOT NULL,
    subject_name      VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subject_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id) ON DELETE CASCADE
);

-- ACTIVITY
CREATE TABLE IF NOT EXISTS activity (
    activity_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id        UUID NOT NULL,
    title             VARCHAR(255) NOT NULL,
    type              VARCHAR(50) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_subject FOREIGN KEY (subject_id)
        REFERENCES subjects (subject_id) ON DELETE CASCADE
);

-- ACTIVITY_FILES
CREATE TABLE IF NOT EXISTS activity_files (
    file_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minio_path        TEXT NOT NULL,
    activity_id       UUID NOT NULL,
    CONSTRAINT fk_activity_files_activity FOREIGN KEY (activity_id)
        REFERENCES activity (activity_id) ON DELETE CASCADE
);

-- PERFORMANCE (Composite Primary Key)
CREATE TABLE IF NOT EXISTS performance (
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

-- CHAT
CREATE TABLE IF NOT EXISTS chat (
    chat_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id        UUID NOT NULL,
    chat_name         VARCHAR(255) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_subject FOREIGN KEY (subject_id)
        REFERENCES subjects (subject_id) ON DELETE CASCADE
);

-- CHAT_FILES
CREATE TABLE IF NOT EXISTS chat_files (
    file_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id           UUID NOT NULL,
    minio_path        TEXT NOT NULL,
    type              VARCHAR(20) NOT NULL CHECK (type IN ('Input', 'Output')),
    indexed           BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_files_chat FOREIGN KEY (chat_id)
        REFERENCES chat (chat_id) ON DELETE CASCADE
);

