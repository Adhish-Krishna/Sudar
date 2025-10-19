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