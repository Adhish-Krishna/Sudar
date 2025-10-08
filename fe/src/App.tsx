import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/login/login';
import ForgotPassword from './pages/login/ForgotPassword';
import SignUp from './pages/login/SignUp';
import Home from './pages/home/home';
import Classes from './pages/classes/Classes';
// Add this import at the top with other component imports
import ClassSubjects from './pages/classSubjects/ClassSubjects';
import ManageStudents from './pages/students/ManageStudents';
import DoubtClearance from './pages/doubtClearance/DoubtClearance';
import SubjectPage from './pages/subject/SubjectPage';
import MainLayout from './layouts/MainLayout';
import './App.css';

function App() {
  return (
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
              <MainLayout>
                <Home />
              </MainLayout>
            } 
          />
          <Route 
            path="/classes" 
            element={
              <MainLayout>
                <Classes />
              </MainLayout>
            } 
          />
          <Route 
            path="/classes/:classId/subjects" 
            element={
              <MainLayout>
                <ClassSubjects />
              </MainLayout>
            } 
          />
          <Route 
            path="/subject/:subjectId" 
            element={
              <MainLayout>
                <SubjectPage />
              </MainLayout>
            } 
          />
          <Route 
            path="/students" 
            element={
              <MainLayout>
                <ManageStudents />
              </MainLayout>
            } 
          />
          <Route 
            path="/doubt-clearance" 
            element={
              <MainLayout>
                <DoubtClearance />
              </MainLayout>
            } 
          />
          <Route 
            path="/ai-character" 
            element={
              <MainLayout>
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}>
                  <h1>AI Character</h1>
                  <p>Coming Soon...</p>
                </div>
              </MainLayout>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
