import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatApp from "./pages/ChatApp";
import LoginGuest from "./pages/LoginGuest";

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
