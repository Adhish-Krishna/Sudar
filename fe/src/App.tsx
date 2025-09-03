import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          <Route 
            path="/*" 
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/subject/:subjectId" element={<SubjectPage />} />
                  <Route path="/students" element={<div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}><h1>Manage Students</h1><p>Coming Soon...</p></div>} />
                  <Route path="/doubt-clearance" element={<div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}><h1>Doubt Clearance</h1><p>Coming Soon...</p></div>} />
                  <Route path="/ai-character" element={<div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-color)'}}><h1>AI Character</h1><p>Coming Soon...</p></div>} />
                </Routes>
              </MainLayout>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
