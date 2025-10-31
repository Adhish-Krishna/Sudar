import Auth from "./pages/Auth";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Landing from "./pages/Landing";

function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="sudar-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/auth" element={<Auth/>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;
