import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

export default function App() {
  const [room, setRoom] = useState("public");
  const [name, setName] = useState("訪客" + Math.floor(Math.random() * 999));
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(false);
  const [aiPersonality, setAiPersonality] = useState(""); // 空字串 = 不用 AI

  const messagesEndRef = useRef(null);

  const aiOptions = [
    { value: "", label: "一般聊天" },
    { value: "friendly", label: "友善型 AI" },
    { value: "sarcastic", label: "諷刺型 AI" },
    { value: "motivational", label: "勵志型 AI" },
    { value: "academic", label: "學術型 AI" },
  ];

  useEffect(() => {
    // 收到訊息時加入到 messages 狀態
    socket.on("message", (m) => setMessages((s) => [...s, m]));
    socket.on("systemMessage", (m) =>
      setMessages((s) => [...s, { user: { name: "系統" }, message: m }])
    );
    return () => {
      socket.off("message");
      socket.off("systemMessage");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 加入或離開房間
  const toggleRoom = () => {
    if (!joined) {
      socket.emit("joinRoom", { room, user: { name } });
      setJoined(true);
      setMessages((s) => [...s, { user: { name: "系統" }, message: `${name} 加入房間` }]);
    } else {
      socket.emit("leaveRoom");
      setJoined(false);
      setMessages((s) => [...s, { user: { name: "系統" }, message: `${name} 離開房間` }]);
    }
  };

  // 發送訊息
  const send = () => {
    if (!text || !joined) return;

    const messageData = {
      room,
      message: text,
      user: { name },
    };

    if (aiPersonality) {
      // 選擇 AI 人格 → 顯示在畫面上
      setMessages((s) => [...s, messageData]);
      messageData.aiPersonality = aiPersonality; // 後端會回覆 AI 訊息
    }

    socket.emit("message", messageData);
    setText("");
  };

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>尋夢園聊天室</h2>

      {/* 使用者資訊區 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", alignItems: "center" }}>
        <div>
          <label>暱稱：</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "5px", width: "150px" }} />
        </div>

        <div>
          <label>房間：</label>
          <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ padding: "5px" }}>
            <option value="public">大廳</option>
          </select>
        </div>

        <button onClick={toggleRoom} style={{ padding: "5px 15px", cursor: "pointer" }}>
          {joined ? "離開" : "加入"}
        </button>
      </div>

      {/* AI 人格選單 */}
      <div style={{ marginBottom: "15px" }}>
        <label>AI 人格（選擇即對 AI 對話）： </label>
        <select value={aiPersonality} onChange={(e) => setAiPersonality(e.target.value)} style={{ padding: "5px" }}>
          {aiOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 聊天訊息區 */}
      <div style={{
        border: "1px solid #ddd",
        height: "400px",
        overflowY: "auto",
        padding: "10px",
        borderRadius: "5px",
        background: "#fafafa",
        marginBottom: "15px"
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "8px" }}>
            <strong style={{ color: m.user?.name === "系統" ? "#f00" : "#333" }}>{m.user?.name}：</strong>
            <span>{m.message}</span>
          </div>
        ))}
        {!messages.length && <div style={{ color: '#888', textAlign: "center" }}>還沒有人發話，打個招呼吧！</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* 發送訊息區 */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1, padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          placeholder={joined ? "輸入訊息後按 Enter 發送" : "請先加入房間才能發言"}
          disabled={!joined}
        />
        <button onClick={send} style={{ padding: "8px 15px", cursor: "pointer" }} disabled={!joined}>發送</button>
      </div>

      <div style={{ marginTop: "15px", color: '#666', fontSize: "12px", textAlign: "center" }}>
        小提醒：選擇 AI 人格即可自動與 AI 對話，否則為一般聊天室。
      </div>
    </div>
  );
}
