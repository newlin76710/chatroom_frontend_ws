import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ChatApp() {
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState("public");
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [target, setTarget] = useState("");
  const [typing, setTyping] = useState("");

  const socketRef = useRef(null);

  // === 初始化 socket，帶上 Token ===
  useEffect(() => {
    const token = localStorage.getItem("guestToken");

    const socket = io(BACKEND, {
      auth: { token }
    });

    socketRef.current = socket;

    // 連線成功
    socket.on("connect", () => {
      console.log("connected");
    });

    // 系統訊息
    socket.on("systemMessage", msg => {
      setMessages(prev => [...prev, { user: { name: "系統" }, message: msg }]);
    });

    // 訊息
    socket.on("message", msg => {
      setMessages(prev => [...prev, msg]);
      setTyping("");
    });

    // 在線 users
    socket.on("updateUsers", list => setUsers(list));

    return () => socket.disconnect();
  }, []);

  // === 加入房間 ===
  const joinRoom = () => {
    if (!name) return alert("登入錯誤，請重新登入");
    const socket = socketRef.current;

    socket.emit("joinRoom", {
      room,
      user: { name, token: localStorage.getItem("guestToken") }
    });
    setJoined(true);
  };

  // === 離開房間 ===
  const leaveRoom = () => {
    socketRef.current.emit("leaveRoom");
    setJoined(false);
    setMessages([]);
  };

  // === 送出訊息 ===
  const send = () => {
    if (!text || !joined) return;

    const socket = socketRef.current;

    // 2 秒後才顯示 AI typing
    if (target) {
      setTimeout(() => setTyping(`${target} 正在輸入...`), 2000);
    }

    socket.emit("message", {
      room,
      message: text,
      user: { name },
      target
    });

    setText("");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* ---- 左側：在線名單 ---- */}
      <div
        style={{
          width: 180,
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          padding: 10
        }}
      >
        <h3>在線名單</h3>

        {users.map((u, i) => (
          <div
            key={i}
            onClick={() => setTarget(u.name)}
            style={{
              padding: "6px 0",
              cursor: "pointer",
              color:
                u.name === target
                  ? "blue"
                  : u.type === "AI"
                  ? "#d63384"
                  : "#333"
            }}
          >
            {u.name} {u.type === "AI" && "🤖"}
          </div>
        ))}
      </div>

      {/* ---- 中間：聊天室 ---- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 10 }}>
        {!joined ? (
          <div>
            <h2>聊天室登入</h2>
            <p>目前登入身分：{name}</p>
            <button onClick={joinRoom} style={{ padding: 10, fontSize: 18 }}>
              進入聊天室
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                border: "1px solid #ccc",
                padding: 10,
                overflowY: "auto",
                marginBottom: 10
              }}
            >
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <strong>{msg.user?.name}：</strong> {msg.message}
                  {msg.target && (
                    <span style={{ color: "#888" }}> → {msg.target}</span>
                  )}
                </div>
              ))}

              {typing && (
                <div style={{ color: "#888", marginTop: 10 }}>{typing}</div>
              )}
            </div>

            {/* ---- 發送區 ---- */}
            <div style={{ display: "flex" }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ flex: 1, padding: 10 }}
                placeholder={target ? `悄悄話給：${target}` : "輸入訊息..."}
              />
              <button onClick={send} style={{ padding: "10px 20px" }}>
                送出
              </button>
            </div>

            <button
              onClick={leaveRoom}
              style={{ marginTop: 10, color: "red" }}
            >
              離開聊天室
            </button>
          </>
        )}
      </div>
    </div>
  );
}
