# SUDAR Platform: Data Architecture Documentation

## 1. Core Philosophy
The SUDAR platform utilizes a hybrid, multi-database architecture to ensure data integrity, scalability, and powerful AI capabilities. The architecture is composed of four distinct components:

1. **Relational Database (SQL):** The single source of truth for structured, core application data.
2. **Document Database (NoSQL):** For flexible, multi-modal chat session data.
3. **Vector Database:** To power the AI Agent's semantic search and contextual understanding (RAG).
4. **Object Storage:** For storing all binary files (images, PDFs, videos).
## 2. Component 1: Relational Database (PostgreSQL)
The SQL database manages the core entities and their relationships, guaranteeing data integrity.

### Entity Relationship Diagram (ERD)
_(Note: You would replace this with a hosted image of your ERD)_

### Schema Breakdown
- `**teachers**` : Stores user accounts for educators. Manages authentication.
- `**emailVerificationCode**` : Temporary storage for account verification codes.
- `**classrooms**` : The central organizational hub. A `teacher`  manages one `classroom` .
- `**students**` : Stores student profiles. Each student belongs to a single `classroom` . `rollno`  is the Primary Key.
- `**subjects**` : Subjects taught within a `classroom` .
- `**worksheets**` ** & **`**content**` : Metadata for educational assets created by the teacher. Linked to a `subject` .
- `**performance**` : Tracks a student's submission for a worksheet.
    - **Key Feature:** Uses a **Composite Primary Key** on (`student_rollno` , `worksheet_id` ) to ensure a student can only have one performance record per worksheet, guaranteeing data uniqueness at the database level.
## 3. Component 2: Document Database (MongoDB)
The NoSQL database is designed to handle the unstructured, rich-media nature of the AI chat sessions.

### `chats` Collection Schema
- **Purpose:** A single document in this collection represents one complete conversation between a teacher and the AI.
- **Structure:**
    - **Top-Level Fields:** Contains metadata like `_id` , `teacher_id` , `classroom_id` , and `topic` . It also holds references (`final_asset_id` , `final_asset_type` ) to the final asset created in the SQL database.
    - `**messages**` ** Array:** The core of the document. It's an ordered array of message objects.
    - **Message Object:** Each message has a `sender`  and a `content`  object.
    - `**content**` ** Object:** A flexible object with two keys:
        1. `**type**` : A string that defines the content type (e.g., `'text'` , `'pdf'` , `'image'` ). The application UI uses this to render the content correctly.
        2. `**data**` : A `Mixed Type`  object whose structure depends on the `type` . This provides the flexibility to store varied data formats.
## 4. Component 3: Vector Database (e.g., Pinecone, Chroma)
The vector database powers the "long-term memory" and contextual reasoning of the SUDAR AI Agent.

### Vector Object Schema
Each entry in the vector database consists of:

- `**id**` : A unique identifier for the vector/chunk.
- `**vector**` : The numerical embedding representing the text chunk.
- `**metadata**` : A JSON object containing crucial context for filtering, such as:
    - `teacher_id` 
    - `classroom_id` 
    - `chat_id` 
    - `document_type`  (e.g., 'pdf', 'web_scrape')
## 5. Component 4: Object Storage (e.g., MinIO, GCS, S3)
All large binary files are stored in a dedicated object storage service, not in the databases.

### Workflow
1. **Upload:** A file (PDF, image, etc.) is uploaded to the object storage service.
2. **Get URL:** The service returns a unique, persistent URL for the file.
3. **Store URL:** **Only the URL string** is stored in the `data`  object of the corresponding message in the NoSQL chat document. This keeps the databases lightweight and fast.


