import Auth from "./pages/Auth";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import { Toaster } from "./components/ui/sonner";

function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="sudar-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/auth" element={<Auth/>} />
            <Route path="/forgotpassword" element={<ForgotPassword/>}/>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center"/>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;
