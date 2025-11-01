import Auth from "./pages/Auth";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import { SidebarTrigger } from "./components/ui/sidebar";
import RootLayout, { AuthLayout, DashboardLayout } from "./app/layout";
import { Toaster } from "./components/ui/sonner";

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
                <SidebarTrigger/>
                <Home/>
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
