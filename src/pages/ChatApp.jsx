// ChatApp.jsx
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import ReactPlayer from "react-player";
import { aiAvatars, aiProfiles } from "./aiConfig";
import './ChatApp.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(BACKEND);

export default function ChatApp() {
  const [room, setRoom] = useState("public");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [guestToken, setGuestToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(false);
  const [target, setTarget] = useState("");
  const [typing, setTyping] = useState("");
  const [userList, setUserList] = useState([]);
  const [showUserList, setShowUserList] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);

  const messagesEndRef = useRef(null);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket 事件
  useEffect(() => {
    socket.on("message", (m) => {
      setMessages(s => [...s, m]);
      if (m.user && aiAvatars[m.user.name] && m.target) setTyping("");
    });
    socket.on("systemMessage", (m) => setMessages(s => [...s, { user: { name: "系統" }, message: m }]));
    socket.on("updateUsers", (list) => setUserList(list));
    socket.on("videoUpdate", (video) => setCurrentVideo(video));

    return () => {
      socket.off("message");
      socket.off("systemMessage");
      socket.off("updateUsers");
      socket.off("videoUpdate");
    };
  }, []);

  // 頁面進入時自動登入
  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedToken = localStorage.getItem("token") || localStorage.getItem("guestToken");
    const type = localStorage.getItem("type");

    if (!storedName) return;

    setName(storedName);
    setToken(localStorage.getItem("token") || "");
    setGuestToken(localStorage.getItem("guestToken") || "");

    socket.emit("joinRoom", {
      room,
      user: { name: storedName, type: type || "guest", token: storedToken }
    });
    setJoined(true);
  }, []);

  // 訪客登入
  const loginGuest = async () => {
    try {
      const res = await fetch(`${BACKEND}/auth/guest`, { method: "POST" });
      const data = await res.json();
      if (!data.guestToken) throw new Error("訪客登入失敗");

      localStorage.setItem("guestToken", data.guestToken);
      localStorage.setItem("name", data.name);
      localStorage.setItem("type", "guest");

      setName(data.name);
      setGuestToken(data.guestToken);
      joinRoom(data.name, "guest", data.guestToken);
    } catch (err) {
      alert("訪客登入失敗：" + err.message);
      console.error(err);
    }
  };

  // 帳號登入
  const loginAccount = async (username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", username);
    localStorage.setItem("type", "account");

    setName(username);
    setToken(token);
    joinRoom(username, "account", token);
  };

  const joinRoom = (username, type = "guest", t = "") => {
    socket.emit("joinRoom", { room, user: { name: username, type, token: t } });
    setJoined(true);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { room, user: { name } });
    setJoined(false);
    setMessages(s => [...s, { user: { name: "系統" }, message: `${name} 離開房間` }]);

    localStorage.removeItem("guestToken");
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("type");

    window.location.href = "/login";
  };

  const send = () => {
    if (!text || !joined) return;
    socket.emit("message", { room, message: text, user: { name }, target });
    setText("");
  };

  // 點播 YouTube 影片
  const playVideo = () => {
    if (!text || !joined) return;
    socket.emit("playVideo", { room, url: text, requestedBy: name });
    setText("");
  };

  return (
    <div className="chat-container">
      <h2>尋夢園聊天室</h2>

      {!joined ? (
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={loginGuest}>訪客登入</button>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Hi, {name}</strong> <button onClick={leaveRoom}>離開聊天室</button>
        </div>
      )}

      <div className="chat-main">
        {/* 聊天區 */}
        <div className="chat-box">
          <div className="chat-messages">
            {messages.map((m, i) => {
              const isSelf = m.user?.name === name;
              const isAI = aiAvatars[m.user?.name];
              const profile = aiProfiles[m.user?.name] || { color: isAI ? "#fff" : "#000" };
              return (
                <div key={i} className="message-row" style={{ justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                  {!isSelf && isAI && <img src={aiAvatars[m.user?.name]} alt={m.user.name} className="message-avatar" />}
                  <div
                    className={`chat-message${isSelf ? " self" : isAI ? " ai" : ""}${m.user?.name === "系統" ? " system" : ""}`}
                    style={{ color: m.user?.name === "系統" ? "#ff5555" : profile.color }}
                  >
                    <strong>{m.user?.name}{m.target ? ` 對 ${m.target} 說` : ""}：</strong> {m.message}
                  </div>
                </div>
              );
            })}
            {typing && <div className="typing">{typing}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* 輸入區 */}
          <div className="chat-input">
            <select value={target} onChange={e => setTarget(e.target.value)}>
              <option value="">發送給全部</option>
              {userList.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" ? send() : null}
              disabled={!joined}
              placeholder={joined ? "輸入訊息 / 點播 YouTube URL" : "請先登入"}
            />
            <button onClick={send} disabled={!joined}>發送</button>
            <button onClick={playVideo} disabled={!joined}>點播</button>
          </div>

          {/* YouTube 播放器 */}
          {currentVideo && (
            <div className="video-player">
              <strong>正在播放：{currentVideo.url} （由 {currentVideo.requestedBy} 點播）</strong>
              <ReactPlayer url={currentVideo.url} playing controls width="100%" />
            </div>
          )}
        </div>

        {/* 使用者列表 */}
        <div className="user-list">
          <div className="user-list-header">
            <strong>在線人數: {userList.length}</strong>
            <button onClick={() => setShowUserList(!showUserList)}>
              {showUserList ? "▼" : "▲"}
            </button>
          </div>
          {showUserList && (
            <div className="user-list-content">
              {userList.map(u => {
                const isSelected = u.name === target;
                const avatar = aiAvatars[u.name];
                const level = aiProfiles[u.name]?.level || u.level || 1;
                return (
                  <div
                    key={u.id}
                    className={`user-item${isSelected ? " selected" : ""}`}
                    onClick={() => setTarget(u.name)}
                  >
                    {avatar && <img src={avatar} alt={u.name} className="user-avatar" />}
                    <span>{u.name} (Lv.{level})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
