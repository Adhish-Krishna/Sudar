import Auth from "./pages/Auth";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import RootLayout, { AuthLayout, DashboardLayout } from "./app/layout";
import { Toaster } from "./components/ui/sonner";
import Classroom from "./pages/Classroom";
import Subject from "./pages/Subject";
import Chat from "./pages/Chat";

function App() {

  return (
    <RootLayout>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AuthLayout>
              <Landing/>
            </AuthLayout>
          }/>
          
          <Route path="/auth" element={
            <AuthLayout>
              <Auth/>
            </AuthLayout>
          } />

          <Route path="/forgotpassword" element={
            <AuthLayout>
              <ForgotPassword/>
            </AuthLayout>
          }/>
          
          <Route path="/home" element={
            <DashboardLayout>
              <ProtectedRoute>
                <Home/>
              </ProtectedRoute>
            </DashboardLayout>
          }/>

          <Route path="/classroom/:classroom_id" element={
            <DashboardLayout>
              <ProtectedRoute>
                <Classroom/>
              </ProtectedRoute>
            </DashboardLayout>
          }/>

          <Route path="/subject/:classroom_id/:subject_id/:color" element={
            <DashboardLayout>
              <ProtectedRoute>
                <Subject/>
              </ProtectedRoute>
            </DashboardLayout>
          }/>

          <Route path="/chat/:classroom_id/:subject_id/:color" element={
            <DashboardLayout>
              <ProtectedRoute>
                <Chat/>
              </ProtectedRoute>
            </DashboardLayout>
          }/>

        </Routes>
      </BrowserRouter>
      <Toaster position="top-center"/>
    </RootLayout>
  )
}

export default App;
