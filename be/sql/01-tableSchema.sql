
-- TEACHERS
CREATE TABLE teachers (
    teacher_id         VARCHAR(50) PRIMARY KEY,
    teacher_name       VARCHAR(100) NOT NULL,
    email              VARCHAR(100) UNIQUE NOT NULL,
    resetPasswordCode  VARCHAR(100),
    codeExpiryTime     TIMESTAMP,
    hashed_password    VARCHAR(255) NOT NULL
);

-- EMAIL VERIFICATION CODE
CREATE TABLE emailVerificationCode (
    email        VARCHAR(100) PRIMARY KEY,
    code         VARCHAR(20) NOT NULL,
    expiryTime   TIMESTAMP NOT NULL
);

-- CLASSROOMS
CREATE TABLE classrooms (
    classroom_id   VARCHAR(50) PRIMARY KEY,
    teacher_id     VARCHAR(50) NOT NULL,
    classroom_name VARCHAR(100) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classroom_teacher FOREIGN KEY (teacher_id)
        REFERENCES teachers (teacher_id)
        ON DELETE CASCADE
);

-- STUDENTS
CREATE TABLE students (
    rollno        VARCHAR(50) PRIMARY KEY,
    classroom_id  VARCHAR(50) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    dob           DATE NOT NULL,
    grade         VARCHAR(10) NOT NULL,
    CONSTRAINT fk_student_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id)
        ON DELETE CASCADE
);

-- SUBJECTS
CREATE TABLE subjects (
    subject_id     VARCHAR(50) PRIMARY KEY,
    classroom_id   VARCHAR(50) NOT NULL,
    subject_name   VARCHAR(100) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subject_classroom FOREIGN KEY (classroom_id)
        REFERENCES classrooms (classroom_id)
        ON DELETE CASCADE
);

-- WORKSHEETS
CREATE TABLE worksheets (
    worksheet_id   VARCHAR(50) PRIMARY KEY,
    subject_id     VARCHAR(50) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_worksheet_subject FOREIGN KEY (subject_id)
        REFERENCES subjects (subject_id)
        ON DELETE CASCADE
);

-- CONTENT
CREATE TABLE content (
    content_id     VARCHAR(50) PRIMARY KEY,
    subject_id     VARCHAR(50) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_content_subject FOREIGN KEY (subject_id)
        REFERENCES subjects (subject_id)
        ON DELETE CASCADE
);

-- PERFORMANCE (Composite Primary Key)
CREATE TABLE performance (
    student_rollno   VARCHAR(50) NOT NULL,
    worksheet_id     VARCHAR(50) NOT NULL,
    teacher_feedback TEXT,
    teacher_grade    INT,
    PRIMARY KEY (student_rollno, worksheet_id),
    CONSTRAINT fk_performance_student FOREIGN KEY (student_rollno)
        REFERENCES students (rollno)
        ON DELETE CASCADE,
    CONSTRAINT fk_performance_worksheet FOREIGN KEY (worksheet_id)
        REFERENCES worksheets (worksheet_id)
        ON DELETE CASCADE
);
