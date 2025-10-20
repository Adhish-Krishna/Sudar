import axios, {type AxiosInstance} from 'axios';

// Base API configuration
const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with cookie support
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
  dob: string; // ISO date string (YYYY-MM-DD)
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
  dob: string; // ISO date string
  grade: number;
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
            "message": response.data
          }
        }
      } catch (error: any) {
        return {
          "status": error.response?.status || 500,
          "message": error.response?.data?.message || error.message || "Signup failed"
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
          "message": response.data
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Email verification failed"
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
          "message": response.data
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Login failed"
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
          "message": response.data
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Forgot password failed"
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
          "message": response.data
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Password reset failed"
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
            "message": response.data
        }
      }
    } catch (error: any) {
      // Handle axios errors (401, 403, network errors, etc.)
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Authentication check failed"
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
            "message": response.data
        }
      }
    } catch (error: any) {
      return {
        "status": error.response?.status || 500,
        "message": error.response?.data?.message || error.message || "Logout failed"
      }
    }
  }
}

export const classrooms = {
  // Create a new classroom
  createClassroom: async (body: ClassroomCreate): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/classrooms`, body);
      if (response.status == 201) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Create classroom failed",
      };
    }
  },

  // Get all classrooms for current teacher
  getClassrooms: async (): Promise<ClassroomResponse[] | any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/classrooms`);
      if (response.status == 200) {
        return response.data as ClassroomResponse[];
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get classrooms failed",
      };
    }
  },

  // Get specific classroom by id
  getClassroom: async (classroom_id: string): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/classrooms/${classroom_id}`);
      if (response.status == 200) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get classroom failed",
      };
    }
  },

  // Update classroom
  updateClassroom: async (classroom_id: string, body: ClassroomUpdate): Promise<ClassroomResponse | any> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/classrooms/${classroom_id}`, body);
      if (response.status == 200) {
        return response.data as ClassroomResponse;
      } else {
        return {
          status: response.status,
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Update classroom failed",
      };
    }
  },

  // Delete classroom
  deleteClassroom: async (classroom_id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/api/classrooms/${classroom_id}`);
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
        message: error.response?.data?.message || error.message || "Delete classroom failed",
      };
    }
  },
}

export const subjects = {
  // Create a new subject in a classroom
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Create subject failed",
      };
    }
  },

  // Get all subjects for a classroom
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get subjects failed",
      };
    }
  },

  // Get a specific subject by id
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get subject failed",
      };
    }
  },

  // Update a subject
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Update subject failed",
      };
    }
  },

  // Delete a subject
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Delete subject failed",
      };
    }
  },
}

export const students = {
  // Create a new student in a classroom
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Create student failed",
      };
    }
  },

  // Get all students in a classroom
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get students failed",
      };
    }
  },

  // Get a specific student by roll number
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Get student failed",
      };
    }
  },

  // Update a student
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Update student failed",
      };
    }
  },

  // Delete a student
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
          message: response.data,
        };
      }
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Delete student failed",
      };
    }
  },
}