// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Window from "./Frontend/Window";
import Signup from "./Frontend/SignUpComponent";
import Login from "./Frontend/LoginComponent";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main chess game window */}
        <Route path="/" element={<Window />} />

        {/* Authentication routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}
