import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/login/login';
import Home from './pages/home/Home';
import Classes from './pages/classes/Classes';
import SubjectPage from './pages/subject/SubjectPage';
import MainLayout from './layouts/MainLayout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}>
                  <h1>Manage Students</h1>
                  <p>Coming Soon...</p>
                </div>
              </MainLayout>
            } 
          />
          <Route 
            path="/doubt-clearance" 
            element={
              <MainLayout>
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}>
                  <h1>Doubt Clearance</h1>
                  <p>Coming Soon...</p>
                </div>
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
