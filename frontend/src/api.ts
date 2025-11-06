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
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  query: string;
}

export interface ChatResponse {
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  response: string;
}

export interface ChatMetadata {
  chat_id: string;
  subject_id?: string | null;
  latest_timestamp: string;
  message_count: number;
}

export interface ListChatsResponse {
  user_id: string;
  subject_id?: string | null;
  chats: ChatMetadata[];
  total_chats: number;
}

export interface DeleteChatResponse {
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  deleted_count: number;
  message: string;
}

export interface ChatMessage {
  _id: string;
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  role: string;
  content: string;
  timestamp: string;
}

export type SSEEventType = 'start' | 'token' | 'done' | 'error' | string;
export interface SSEEvent {
  type: SSEEventType;
  content: string;
}

export interface IngestResponse {
  status: string;
  message: string;
  job_id: string;
  user_id: string;
  chat_id: string;
  classroom_id?: string | null;
  filename: string;
}

export interface RetrievalRequest {
  query: string;
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  top_k?: number;
  filenames?: string[] | null;
}

export interface RetrievalResponse {
  status: string;
  query: string;
  user_id: string;
  chat_id: string;
  classroom_id?: string | null;
  results: any[];
  count: number;
}

export interface ListChunksResponse {
  status: string;
  user_id: string;
  chat_id: string;
  classroom_id?: string | null;
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
    subjectId: string,
    chatId: string
  ): Promise<DocumentListResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/documents/input-documents/${userId}/${subjectId}/${chatId}`
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
    subjectId: string,
    chatId: string
  ): Promise<DocumentListResponse | any> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/documents/output-documents/${userId}/${subjectId}/${chatId}`
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

const AGENT_BASE = `${API_BASE_URL}/agent/api`;
async function streamSSEPost(
  url: string,
  body: unknown,
  onEvent: (ev: SSEEvent) => void,
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
    let buf = '';

    const processBuffer = () => {
      let boundary = buf.indexOf('\n\n');
      while (boundary === -1 && buf.indexOf('\r\n\r\n') !== -1) {
        boundary = buf.indexOf('\r\n\r\n');
      }
      while (boundary !== -1) {
        const rawEvent = buf.slice(0, boundary);
        buf = buf.slice(boundary + (buf[boundary] === '\r' ? 4 : 2));

        const lines = rawEvent.split(/\r?\n/);
        const dataLines: string[] = [];
        for (const l of lines) {
          const idx = l.indexOf('data:');
          if (idx !== -1) dataLines.push(l.slice(idx + 5).trim());
        }
        if (dataLines.length === 0) {
          boundary = buf.indexOf('\n\n');
          continue;
        }
        const dataStr = dataLines.join('\n');
        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch (e) {
          try {
            let s = dataStr;
            s = s.replace(/\bNone\b/g, 'null');
            s = s.replace(/\bTrue\b/g, 'true');
            s = s.replace(/\bFalse\b/g, 'false');
            s = s.replace(/([\{,\s])'([^']+?)'\s*:/g, '$1"$2":');
            s = s.replace(/:\s*'([^']*?)'(?=[,}])/g, ': "$1"');
            parsed = JSON.parse(s);
          } catch (e2) {
            parsed = null;
          }
        }

        if (parsed && typeof parsed === 'object' && 'type' in parsed) {
          onEvent({ type: parsed.type, content: parsed.content ?? '' });
        } else {
          onEvent({ type: 'message', content: dataStr });
        }

        boundary = buf.indexOf('\n\n');
      }
    };
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          processBuffer();
        }
        // final
        buf += decoder.decode();
        processBuffer();
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
  streamChat: async (
    request: ChatRequest,
    handlers: {
      onEvent: (ev: SSEEvent) => void;
      onError?: (err: any) => void;
    }
  ): Promise<() => void> => {
    const url = `${AGENT_BASE}/chat`;
    return streamSSEPost(url, request, handlers.onEvent, handlers.onError);
  },

  chatSync: async (request: ChatRequest): Promise<ChatResponse | any> => {
    try {
      const response = await apiClient.post(`${AGENT_BASE}/chat/sync`, request);
      if (response.status === 200) return response.data as ChatResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Chat sync failed' };
    }
  },

  getChats: async (userId: string, subjectId?: string | null): Promise<ListChatsResponse | any> => {
    try {
      let url = `${AGENT_BASE}/chat/list/${userId}`;
      const params: any = {};
      if (subjectId) params.subject_id = subjectId;
      const response = await apiClient.get(url, { params });
      if (response.status === 200) return response.data as ListChatsResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Get chats failed' };
    }
  },

  getChatHistory: async (
    chatId: string,
    userId: string,
    subjectId?: string | null,
    limit?: number
  ): Promise<ChatMessage[] | any> => {
    try {
      let url = `${AGENT_BASE}/chat/history/${userId}/${chatId}`;
      const params: any = {};
      if (subjectId) params.subject_id = subjectId;
      if (limit) params.limit = limit;
      const response = await apiClient.get(url, { params });
      if (response.status === 200) return response.data.messages as ChatMessage[];
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Get chat history failed' };
    }
  },

  deleteChat: async (chatId: string, userId: string, subjectId?: string | null): Promise<DeleteChatResponse | any> => {
    try {
      let url = `${AGENT_BASE}/chat/${userId}/${chatId}`;
      const params: any = {};
      if (subjectId) params.subject_id = subjectId;
      const response = await apiClient.delete(url, { params });
      if (response.status === 200) return response.data as DeleteChatResponse;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Delete chat failed' };
    }
  },

  health: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/agent/health`);
      if (response.status === 200) return response.data;
      return { status: response.status, message: response.data };
    } catch (error: any) {
      return { status: error.response?.status || 500, message: error.response?.data?.message || error.message || 'Agent health check failed' };
    }
  }
};

const RAG_BASE = `${API_BASE_URL}/rag`;

export const ragService = {
  ingestDocument: async (
    file: File,
    userId: string,
    chatId: string,
    subjectId?: string | null
  ): Promise<IngestResponse | any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('chat_id', chatId);
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
      if (subjectId) params.classroom_id = subjectId;
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
      if (subjectId) params.classroom_id = subjectId;
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

