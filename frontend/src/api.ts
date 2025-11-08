import axios, {type AxiosInstance} from 'axios';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SignUp{
  teacher_name: string,
  email: string,
  password: string,
  verification_code: string
}

export interface EmailVerification{
  email: string,
  teacher_name: string
}

export interface SignUpSuccRes{
  message: string,
  teacher_id: string,
  teacher_name: string,
  email: string
}

export interface VerifyEmailSuccRes{
  message: string,
  email: string
}

export interface Login{
  email: string,
  password: string
}

export interface ForgotPassword{
  email: string
}

export interface ForgotPasswordSuccRes{
  message: string
}

export interface ResetPassword{
  email: string,
  code: string,
  new_password: string
}

export interface Teacher{
  teacher_id: string,
  teacher_name: string,
  email: string
}

export interface ClassroomCreate {
  classroom_name: string;
}

export interface ClassroomUpdate {
  classroom_name: string;
}

export interface ClassroomResponse {
  classroom_id: string;
  teacher_id: string;
  classroom_name: string;
  created_at: string; 
}

export interface SubjectCreate {
  subject_name: string;
}

export interface SubjectUpdate {
  subject_name: string;
}

export interface SubjectResponse {
  subject_id: string;
  classroom_id: string;
  subject_name: string;
  created_at: string;
}

export interface StudentCreate {
  rollno: string;
  student_name: string;
  dob: string;
  grade: number;
}

export interface StudentUpdate {
  student_name?: string;
  dob?: string;
  grade?: number;
}

export interface StudentResponse {
  rollno: string;
  classroom_id: string;
  student_name: string;
  dob: string;
  grade: number;
}

export type ActivityTypeEnum = 'Worksheet' | 'Content';

export interface FileCreate {
  minio_path: string;
}

export interface FileResponse {
  file_id: string;
  minio_path: string;
  activity_id: string;
}

export interface ActivityCreate {
  title: string;
  type: ActivityTypeEnum;
  files?: FileCreate[];
}

export interface ActivityUpdate {
  title?: string;
}

export interface ActivityResponse {
  activity_id: string;
  subject_id: string;
  title: string;
  type: ActivityTypeEnum;
  created_at: string;
  files: FileResponse[];
}

export interface MinioDocument {
  name: string;
  size: number;
  last_modified: string | null;
}

export interface DocumentListResponse {
  bucket: string;
  prefix: string;
  documents: MinioDocument[];
  count: number;
}

export interface ChatRequest {
  chat_id: string;
  subject_id?: string;
  classroom_id: string;
  query: string;
  flow_type: 'doubt_clearance' | 'worksheet_generation';
}

export interface ChatMessage {
  messageId: string;
  messageType: 'user' | 'agent';
  userMessage?: {
    query: string;
    inputFiles: Array<{
      filepath: string;
      filename?: string;
      uploadedAt: Date;
    }>;
    timestamp: Date;
  };
  agentMessage?: {
    flowType: 'doubt_clearance' | 'worksheet_generation' | 'content_research' | 'generic_chat';
    startTime: Date;
    endTime?: Date;
    totalSteps: number;
    steps: any[];
    research_findings: {
      content: string;
      researched_websites: string[];
    };
    worksheet_content: string;
    finalMetadata?: any;
    executionSummary: {
      success: boolean;
      totalToolCalls: number;
      totalTextLength: number;
      duration: number;
      errorCount: number;
      finalStatus: string;
    };
    fileProcessing?: {
      extractedFiles: string[];
      fileRetrievals: number;
      hasFiles: boolean;
    };
  };
  timestamp: Date;
}

export interface ChatConversation {
  chatId: string;
  userId: string;
  subjectId: string;
  classroomId: string;
  title?: string;
  description?: string;
  tags?: string[];
  messages: ChatMessage[];
  conversationMetadata: {
    totalMessages: number;
    totalUserQueries: number;
    totalAgentResponses: number;
    totalFilesProcessed: number;
    conversationStartTime: Date;
    lastActivityTime: Date;
    averageResponseTime?: number;
  };
  status: 'active' | 'archived' | 'deleted';
  isPublic: boolean;
}

export interface GetChatMessagesResponse {
  success: boolean;
  chatId: string;
  totalMessages: number;
  messages: ChatMessage[];
  metadata: ChatConversation['conversationMetadata'];
}

export interface ChatSummary {
  chatId: string;
  title?: string;
  description?: string;
  tags?: string[];
  totalMessages: number;
  totalUserQueries: number;
  totalAgentResponses: number;
  conversationStartTime: Date;
  lastActivityTime: Date;
  status: 'active' | 'archived' | 'deleted';
}

export interface GetChatsBySubjectResponse {
  success: boolean;
  subject_id: string;
  totalChats: number;
  page: number;
  limit: number;
  chats: ChatSummary[];
}

export interface DeleteChatResponse {
  success: boolean;
  message: string;
  chatId: string;
}

export type SSEEventType = 'start' | 'token' | 'done' | 'error' | 'status' | 'phase_change' | 'tool_call' | 'tool_result' | 'metadata' | 'phase_complete' | string;

export interface SSEEvent {
  type: SSEEventType;
  flowType?: 'doubt_clearance' | 'worksheet_generation';
  content: string;
  metadata?: any;
}

export interface IngestResponse {
  status: string;
  message: string;
  job_id: string;
  user_id: string;
  chat_id: string;
  classroom_id: string;
  subject_id?: string | null;
  filename: string;
}

export interface RetrievalRequest {
  query: string;
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  classroom_id: string;
  top_k?: number;
  filenames?: string[] | null;
}

export interface RetrievalResponse {
  status: string;
  query: string;
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  classroom_id: string;
  results: any[];
  count: number;
}

export interface ListChunksResponse {
  status: string;
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  classroom_id: string;
  chunks: any[];
  count: number;
}

export interface IndexedFileResponse{
  file_id: string;
  filename: string;
  minio_path: string;
}

export const authAPI = {
  signUp : async (body: SignUp): Promise<SignUpSuccRes | any>=>{
      try {
        const response = await apiClient.post(`${API_BASE_URL}/api/auth/signup`, body);
        if(response.status == 201){
          return response.data as SignUpSuccRes
        }
        else{
          return {
            "status": response.status,
            "message": response.data?.message || response.data?.detail || "Signup failed"
          }
        }
      } catch (error: any) {
        return {
          "status": error.response?.status || 500,
          "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Signup failed"
        }
      }
  },
  verifyEmail: async (body: EmailVerification): Promise<VerifyEmailSuccRes | any>=>{
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/send-verification-code`, body);
      if(response.status == 200){
        return response.data as VerifyEmailSuccRes;
      }
      else{
        return {
          "status": response.status,
          "message": response.data?.message || response.data?.detail || "Email verification failed"
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Email verification failed"
      }
    }
  },
  login: async (body: Login): Promise<SignUpSuccRes | any>=>{
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/login`, body);
      if(response.status == 200){
        return response.data as SignUpSuccRes;
      }
      else{
        return {
          "status": response.status,
          "message": response.data?.message || response.data?.detail || "Login failed"
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Login failed"
      }
    }
  },
  forgotPassword: async (body: ForgotPassword): Promise<ForgotPasswordSuccRes |any> =>{
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/forgot-password`, body);
      if(response.status == 200){
        return response.data as ForgotPasswordSuccRes;
      }
      else{
        return {
          "status": response.status,
          "message": response.data?.message || response.data?.detail || "Forgot password failed"
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Forgot password failed"
      }
    }
  },
  resetPassword: async (body: ResetPassword): Promise<ForgotPasswordSuccRes | any>=>{
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/reset-password`, body);
      if(response.status == 200){
        return response.data as ForgotPasswordSuccRes;
      }
      else{
        return {
          "status": response.status,
          "message": response.data?.message || response.data?.detail || "Password reset failed"
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Password reset failed"
      }
    }
  },
  getStatus: async (): Promise<Teacher | any>=>{
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/auth/me`);
      if(response.status == 200){
        return response.data as Teacher;
      }
      else{
        return {
            "status": response.status,
            "message": response.data?.message || response.data?.detail || "Authentication check failed"
        }
      }
    } catch (error: any) {
      // Handle axios errors (401, 403, network errors, etc.)
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Authentication check failed"
      }
    }
  },
  logout: async (): Promise<ForgotPasswordSuccRes | any>=>{
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/logout`);
      if(response.status == 200){
        return response.data as ForgotPasswordSuccRes;
      }
      else{
        return {
            "status": response.status,
            "message": response.data?.message || response.data?.detail || "Logout failed"
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.detail || error.response?.data?.message || error.message || "Logout failed"
      }
    }
  }
}

export const classrooms = {
  createClassroom: async (body: ClassroomCreate): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/classrooms`, body);
      if (response.status == 201) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Create classroom failed",
      };
    }
  },

  getClassrooms: async (): Promise<ClassroomResponse[] | any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/classrooms`);
      if (response.status == 200) {
        return response.data as ClassroomResponse[];
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get classrooms failed",
      };
    }
  },

  getClassroom: async (classroom_id: string): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/classrooms/${classroom_id}`);
      if (response.status == 200) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get classroom failed",
      };
    }
  },

  updateClassroom: async (classroom_id: string, body: ClassroomUpdate): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/classrooms/${classroom_id}`, body);
      if (response.status == 200) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Update classroom failed",
      };
    }
  },

  deleteClassroom: async (classroom_id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/api/classrooms/${classroom_id}`);
      if (response.status == 204) {
        return { message: "Deleted" };
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Delete classroom failed",
      };
    }
  },
}

export const subjects = {
  createSubject: async (classroomId: string, body: SubjectCreate): Promise<SubjectResponse | any> => {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/classrooms/${classroomId}/subjects`,
        body
      );
      if (response.status == 201) {
        return response.data as SubjectResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Create subject failed",
      };
    }
  },
  getSubjects: async (classroomId: string): Promise<SubjectResponse[] | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/classrooms/${classroomId}/subjects`
      );
      if (response.status == 200) {
        return response.data as SubjectResponse[];
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get subjects failed",
      };
    }
  },

  getSubject: async (classroomId: string, subjectId: string): Promise<SubjectResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/classrooms/${classroomId}/subjects/${subjectId}`
      );
      if (response.status == 200) {
        return response.data as SubjectResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get subject failed",
      };
    }
  },

  updateSubject: async (
    classroomId: string,
    subjectId: string,
    body: SubjectUpdate
  ): Promise<SubjectResponse | any> => {
    try {
      const response = await apiClient.put(
        `${API_BASE_URL}/api/classrooms/${classroomId}/subjects/${subjectId}`,
        body
      );
      if (response.status == 200) {
        return response.data as SubjectResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Update subject failed",
      };
    }
  },

  deleteSubject: async (classroomId: string, subjectId: string): Promise<any> => {
    try {
      const response = await apiClient.delete(
        `${API_BASE_URL}/api/classrooms/${classroomId}/subjects/${subjectId}`
      );
      if (response.status == 204) {
        return { message: "Deleted" };
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Delete subject failed",
      };
    }
  },
}

export const students = {
  createStudent: async (classroomId: string, body: StudentCreate): Promise<StudentResponse | any> => {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/classrooms/${classroomId}/students`,
        body
      );
      if (response.status == 201) {
        return response.data as StudentResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Create student failed",
      };
    }
  },

  getStudents: async (classroomId: string): Promise<StudentResponse[] | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/classrooms/${classroomId}/students`
      );
      if (response.status == 200) {
        return response.data as StudentResponse[];
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get students failed",
      };
    }
  },

  getStudent: async (classroomId: string, rollno: string): Promise<StudentResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/classrooms/${classroomId}/students/${rollno}`
      );
      if (response.status == 200) {
        return response.data as StudentResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get student failed",
      };
    }
  },

  updateStudent: async (
    classroomId: string,
    rollno: string,
    body: StudentUpdate
  ): Promise<StudentResponse | any> => {
    try {
      const response = await apiClient.put(
        `${API_BASE_URL}/api/classrooms/${classroomId}/students/${rollno}`,
        body
      );
      if (response.status == 200) {
        return response.data as StudentResponse;
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Update student failed",
      };
    }
  },

  deleteStudent: async (classroomId: string, rollno: string): Promise<any> => {
    try {
      const response = await apiClient.delete(
        `${API_BASE_URL}/api/classrooms/${classroomId}/students/${rollno}`
      );
      if (response.status == 204) {
        return { message: "Deleted" };
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Unexpected response",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Delete student failed",
      };
    }
  },
}

export const activities = {
  createActivity: async (subjectId: string, body: ActivityCreate): Promise<ActivityResponse | any> => {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/activities/subject/${subjectId}`,
        body
      );
      if (response.status == 201) {
        return response.data as ActivityResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Create activity failed",
      };
    }
  },

  getActivitiesBySubject: async (subjectId: string): Promise<ActivityResponse[] | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/activities/subject/${subjectId}`
      );
      if (response.status == 200) {
        return response.data as ActivityResponse[];
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get activities failed",
      };
    }
  },

  getActivity: async (activityId: string): Promise<ActivityResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/activities/${activityId}`
      );
      if (response.status == 200) {
        return response.data as ActivityResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get activity failed",
      };
    }
  },

  updateActivity: async (activityId: string, body: ActivityUpdate): Promise<ActivityResponse | any> => {
    try {
      const response = await apiClient.put(
        `${API_BASE_URL}/api/activities/${activityId}`,
        body
      );
      if (response.status == 200) {
        return response.data as ActivityResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Update activity failed",
      };
    }
  },

  deleteActivity: async (activityId: string): Promise<any> => {
    try {
      const response = await apiClient.delete(
        `${API_BASE_URL}/api/activities/${activityId}`
      );
      if (response.status == 204) {
        return { message: "Deleted" };
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Delete activity failed",
      };
    }
  },
}

export const documents = {
  getInputDocuments: async (
    userId: string,
    classroom_id: string,
    subjectId: string,
    chatId: string
  ): Promise<DocumentListResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/documents/input-documents/${userId}/${classroom_id}/${subjectId}/${chatId}`
      );
      if (response.status == 200) {
        return response.data as DocumentListResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Get input documents failed",
      };
    }
  },

  getOutputDocuments: async (
    userId: string,
    classroom_id: string,
    subjectId: string,
    chatId: string
  ): Promise<DocumentListResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/documents/output-documents/${userId}/${classroom_id}/${subjectId}/${chatId}`
      );
      if (response.status == 200) {
        return response.data as DocumentListResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Get output documents failed",
      };
    }
  },

  downloadDocument: async (
    bucketType: 'input' | 'output',
    documentName: string
  ): Promise<{ blob: Blob; filename: string } | any> => {
    try {
      const safeName = documentName.split('/').map(encodeURIComponent).join('/');
      const response = await apiClient.get(
        `${API_BASE_URL}/api/documents/download/${bucketType}/${safeName}`,
        { responseType: 'blob' }
      );

      if (response.status == 200) {
        const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        let filename = documentName.split('/').pop() || 'download';
        if (contentDisposition) {
          const matches = /filename="?([^";]+)"?/.exec(contentDisposition);
          if (matches && matches[1]) filename = matches[1];
        }
        return { blob: response.data as Blob, filename };
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Download document failed",
      };
    }
  },
};

const AGENT_BASE = `${API_BASE_URL}/agent/api/chat`;
async function streamSSEPost(
  url: string,
  body: unknown,
  onEvent: (ev: any) => void,
  onError?: (err: any) => void
): Promise<() => void> {
  const controller = new AbortController();
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Network error: ${res.status} ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE events (separated by double newlines)
          const events = buffer.split(/\n\n|\r\n\r\n/);
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            // Extract data from SSE format
            const dataMatch = event.match(/^data:\s*(.+)$/m);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                onEvent(parsed);
              } catch (e) {
                console.error('Failed to parse SSE data:', dataMatch[1]);
              }
            }
          }
        }
      } catch (err) {
        if (onError) onError(err);
      }
    })();

    return () => controller.abort();
  } catch (err) {
    if (onError) onError(err);
    return () => controller.abort();
  }
}

export const sudarAgent = {
  /**
   * Stream chat with Server-Sent Events (SSE)
   * POST /agent/api/chat/sse
   */
  streamChat: async (
    request: ChatRequest,
    handlers: {
      onEvent: (ev: SSEEvent) => void;
      onError?: (err: any) => void;
    }
  ): Promise<() => void> => {
    const url = `${AGENT_BASE}/sse`;
    return streamSSEPost(url, request, handlers.onEvent, handlers.onError);
  },

  /**
   * Get all messages for a specific chat
   * GET /agent/api/chat/:chat_id/messages
   */
  getChatMessages: async (chatId: string): Promise<GetChatMessagesResponse | any> => {
    try {
      const response = await apiClient.get(`${AGENT_BASE}/${chatId}/messages`);
      if (response.status === 200){
        console.log('API Response:', response.data);
        return response.data; // Return the data directly instead of wrapping it
      }
    } catch (error: any) {
      return { 
        status: error.response?.status || 500, 
        message: error.response?.data?.message || error.message || 'Failed to get chat messages' 
      };
    }
  },

  /**
   * Get all chats for a specific subject
   * GET /agent/api/chat/subject/:subject_id
   */
  getChatsBySubject: async (
    subjectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetChatsBySubjectResponse | any> => {
    try {
      const response = await apiClient.get(`${AGENT_BASE}/subject/${subjectId}`, {
        params: { page, limit }
      });
      if (response.status === 200) return response.data as GetChatsBySubjectResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { 
        status: error.response?.status || 500, 
        message: error.response?.data?.message || error.message || 'Failed to get chats by subject' 
      };
    }
  },

  /**
   * Delete a chat conversation (hard delete)
   * DELETE /agent/api/chat/:chat_id
   */
  deleteChat: async (chatId: string): Promise<DeleteChatResponse | any> => {
    try {
      const response = await apiClient.delete(`${AGENT_BASE}/${chatId}`);
      if (response.status === 200) return response.data as DeleteChatResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { 
        status: error.response?.status || 500, 
        message: error.response?.data?.message || error.message || 'Failed to delete chat' 
      };
    }
  },

  /**
   * Health check for agent service
   * GET /agent/health
   */
  health: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/agent/health`);
      if (response.status === 200) return response.data;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { 
        status: error.response?.status || 500, 
        message: error.response?.data?.message || error.message || 'Agent health check failed' 
      };
    }
  }
};

const RAG_BASE = `${API_BASE_URL}/rag`;

export const ragService = {
  ingestDocument: async (
    file: File,
    userId: string,
    chatId: string,
    classroomId: string,
    subjectId?: string | null
  ): Promise<IngestResponse | any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('chat_id', chatId);
      formData.append('classroom_id', classroomId);
      if (subjectId) formData.append('subject_id', subjectId);
      const response = await apiClient.post(`${RAG_BASE}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) return response.data as IngestResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Ingest failed' };
    }
  },

  getJobStatus: async (jobId: string): Promise<any> => {
    try {
      const response = await apiClient.get(`${RAG_BASE}/job-status/${jobId}`);
      if (response.status === 200) return response.data;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Get job status failed' };
    }
  },

  retrieveContext: async (request: RetrievalRequest): Promise<RetrievalResponse | any> => {
    try {
      const response = await apiClient.post(`${RAG_BASE}/retrieve`, request);
      if (response.status === 200) return response.data as RetrievalResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Retrieve failed' };
    }
  },

  deleteChatData: async (userId: string, chatId: string, subjectId?: string | null): Promise<any> => {
    try {
      const params: any = {};
      if (subjectId) params.subject_id = subjectId;
      const response = await apiClient.delete(`${RAG_BASE}/delete/${userId}/${chatId}`, { params });
      if (response.status === 200) return response.data;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Delete chat data failed' };
    }
  },

  listChatChunks: async (userId: string, chatId: string, subjectId?: string | null, limit?: number): Promise<ListChunksResponse | any> => {
    try {
      const params: any = {};
      if (subjectId) params.subject_id = subjectId;
      if (limit) params.limit = limit;
      const response = await apiClient.get(`${RAG_BASE}/list/${userId}/${chatId}`, { params });
      if (response.status === 200) return response.data as ListChunksResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'List chunks failed' };
    }
  },

  health: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${RAG_BASE}/health`);
      if (response.status === 200) return response.data;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'RAG health check failed' };
    }
  }
};

export const context = {
  getContext: async (chat_id: string): Promise<IndexedFileResponse[] | any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/context/${chat_id}`);
      if (response.status === 200) {
        return response.data as IndexedFileResponse[];
      } else {
        return {
          status: response.status,
          message: response.data?.detail || response.data?.message || "Get indexed files failed",
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.detail || error.response?.data?.message || error.message || "Get indexed files failed",
      };
    }
  }
}

