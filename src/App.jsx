import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { aiAvatars, aiProfiles } from "./aiConfig";
import './ChatApp.css'; // ← 改成獨立 CSS

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export default function ChatApp() {
  const [room, setRoom] = useState("public");
  const [name, setName] = useState("訪客" + Math.floor(Math.random() * 999));
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(false);
  const [target, setTarget] = useState("");
  const [autoLeaveTime, setAutoLeaveTime] = useState(0);
  const [typing, setTyping] = useState("");
  const [userList, setUserList] = useState([]);
  const [showUserList, setShowUserList] = useState(true);

  const messagesEndRef = useRef(null);
  const autoLeaveRef = useRef(null);

  // --- Socket 事件 ---
  useEffect(() => {
    socket.on("message", (m) => {
      setMessages(s => [...s, m]);
    });

    socket.on("systemMessage", (m) => setMessages(s => [...s, { user: { name: "系統" }, message: m }]));

    socket.on("updateUsers", (list) => setUserList(list));

    return () => {
      socket.off("message");
      socket.off("systemMessage");
      socket.off("updateUsers");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const join = () => {
    socket.emit("joinRoom", { room, user: { name } });
    setJoined(true);
    if (autoLeaveTime > 0) autoLeaveRef.current = setTimeout(() => leave(), autoLeaveTime * 1000);
  };

  const leave = () => {
    socket.emit("leaveRoom", { room, user: { name } });
    setJoined(false);
    setMessages(s => [...s, { user: { name: "系統" }, message: `${name} 離開房間` }]);
    if (autoLeaveRef.current) clearTimeout(autoLeaveRef.current);
  };

  const send = () => {
    if (!text || !joined) return;
    socket.emit("message", { room, message: text, user: { name }, target });
    setText("");
  };

  return (
    <div className="chat-container">
      <h2 className="text-center mb-3">尋夢園聊天室</h2>

      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <label className="form-label">暱稱</label>
          <input className="form-control input-dark" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">房間</label>
          <select className="form-select input-dark" value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="public">大廳</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">自動離開秒數</label>
          <input type="number" min="0" className="form-control input-dark" value={autoLeaveTime} onChange={(e) => setAutoLeaveTime(Number(e.target.value))} />
        </div>
        <div className="col-6 col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={joined ? leave : join}>{joined ? "離開" : "加入"}</button>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-3 mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>在線人數: {userList.length}</strong>
            <button className="btn btn-sm btn-outline-light" onClick={() => setShowUserList(!showUserList)}>
              {showUserList ? "▼" : "▲"}
            </button>
          </div>
          {showUserList && (
            <div className="card card-dark scroll-dark" style={{ maxHeight: "400px" }}>
              <ul className="list-group list-group-flush">
                {userList.map(u => (
                  <li key={u.id} className="list-group-item item-dark" onClick={() => setTarget(u.name)}>
                    {u.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="col-12 col-md-9">
          <div className="card card-dark scroll-dark" style={{ height: "400px", padding: "10px" }}>
            {messages.map((m, i) => {
              const isSelf = m.user?.name === name;
              const isAI = aiAvatars[m.user?.name];
              const profile = aiProfiles[m.user?.name] || { color: isAI ? "#d6b3ff" : "#fff" };
              const alignClass = isSelf ? "justify-content-end text-end" : "justify-content-start text-start";

              return (
                <div key={i} className={`d-flex ${alignClass} mb-2`}>
                  {!isSelf && isAI && (
                    <img src={aiAvatars[m.user?.name]} alt={m.user.name} className="rounded-circle me-2" style={{ width: "38px", height: "38px", border: "2px solid #555" }} />
                  )}
                  <div className={`p-2 rounded`} style={{
                    background: isSelf ? "#2a2a2a" : isAI ? "#3d1a5f" : m.user?.name === "系統" ? "#5f1a1a" : "#1a1a1a",
                    color: m.user?.name === "系統" ? "#ff5555" : profile.color,
                    maxWidth: "75%",
                    wordBreak: "break-word",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.5)"
                  }}>
                    <strong>{m.user?.name}{m.target ? ` 對 ${m.target} 說` : ""}：</strong> {m.message}
                  </div>
                </div>
              );
            })}
            {typing && <div className="text-muted fst-italic">{typing}</div>}
            {!messages.length && <div className="text-center text-muted">還沒有人發話，打個招呼吧！</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-group mb-3">
            <select className="form-select input-dark" value={target} onChange={e => setTarget(e.target.value)}>
              <option value="">發送給全部</option>
              {userList.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <input type="text" className="form-control input-dark" placeholder={joined ? "輸入訊息後按 Enter 發送" : "請先加入房間"} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} disabled={!joined} />
            <button className="btn btn-primary" onClick={send} disabled={!joined}>發送</button>
          </div>
        </div>
      </div>
    </div>
  );
}
