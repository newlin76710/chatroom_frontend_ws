import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginGuest from "./pages/LoginGuest";
import ChatApp from "./pages/ChatApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginGuest />} />
        <Route path="/login" element={<LoginGuest />} />
        <Route path="/chat" element={<ChatApp />} />
      </Routes>
    </BrowserRouter>
  );
}