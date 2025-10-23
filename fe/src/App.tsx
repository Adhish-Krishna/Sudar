import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/login/login.tsx';
import ForgotPassword from './pages/login/ForgotPassword.tsx';
import SignUp from './pages/login/SignUp.tsx';
import Home from './pages/home/home';
import Classroom from './pages/classroom/Classroom';
import SubjectPage from './pages/subject/SubjectPage';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Home />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classSubjects/:classroomId" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Classroom />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classroom/:classroomId/subject/:subjectId" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SubjectPage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
