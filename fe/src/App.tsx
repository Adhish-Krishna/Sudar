import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/login/login.tsx';
import ForgotPassword from './pages/login/ForgotPassword.tsx';
import SignUp from './pages/login/SignUp.tsx';
import Home from './pages/home/home';
import Classroom from './pages/classroom/Classroom';
import Classes from './pages/classes/Classes';
// Add this import at the top with other component imports
import ClassSubjects from './pages/classSubjects/ClassSubjects';
import ManageStudents from './pages/students/ManageStudents';
import DoubtClearance from './pages/doubtClearance/DoubtClearance';
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
              path="/classes" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Classes />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classes/:classId/subjects" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ClassSubjects />
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
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ManageStudents />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doubt-clearance" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DoubtClearance />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-character" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}>
                      <h1>AI Character</h1>
                      <p>Coming Soon...</p>
                    </div>
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
