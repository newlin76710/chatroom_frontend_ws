import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { aiAvatars, aiProfiles } from "./aiConfig";
import YouTube from "react-youtube";
import "./ChatApp.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
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

  // === 影片播放 ===
  const [currentVideo, setCurrentVideo] = useState(null); // { url, timestamp, isPlaying, lastUpdate }
  const [player, setPlayer] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ───────────────────────────────────────
  // Socket 接收事件
  // ───────────────────────────────────────
  useEffect(() => {
    socket.on("message", (m) => {
      setMessages((s) => [...s, m]);
      if (m.user && aiAvatars[m.user.name] && m.target) setTyping("");
    });

    socket.on("systemMessage", (m) =>
      setMessages((s) => [...s, { user: { name: "系統" }, message: m }])
    );

    socket.on("updateUsers", (list) => setUserList(list));

    // 後端同步影片狀態
    socket.on("videoUpdate", (state) => {
      setCurrentVideo(state);
      syncPlayer(state);
    });

    return () => {
      socket.off("message");
      socket.off("systemMessage");
      socket.off("updateUsers");
      socket.off("videoUpdate");
    };
  }, [player]);

  // ───────────────────────────────────────
  // 同步播放
  // ───────────────────────────────────────
  const syncPlayer = (state) => {
    if (!player || !state) return;

    const elapsed = (Date.now() - state.lastUpdate) / 1000;
    const shouldBeTime = state.isPlaying
      ? state.timestamp + elapsed
      : state.timestamp;

    player.seekTo(shouldBeTime, true);

    if (state.isPlaying) player.playVideo();
    else player.pauseVideo();
  };

  // ───────────────────────────────────────
  // YouTube 事件
  // ───────────────────────────────────────
  const onReady = (event) => {
    setPlayer(event.target);

    // iPhone 必須有第一次手動操作
    event.target.playVideo();
    setTimeout(() => event.target.pauseVideo(), 50);

    if (currentVideo) syncPlayer(currentVideo);
  };

  const onPlay = () => {
    socket.emit("resumeVideo", { room });
  };

  const onPause = () => {
    socket.emit("pauseVideo", { room });
  };

  // ───────────────────────────────────────
  // 登入流程
  // ───────────────────────────────────────
  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedToken =
      localStorage.getItem("token") || localStorage.getItem("guestToken");
    const type = localStorage.getItem("type");

    if (!storedName) return;

    setName(storedName);
    setToken(localStorage.getItem("token") || "");
    setGuestToken(localStorage.getItem("guestToken") || "");

    socket.emit("joinRoom", {
      room,
      user: { name: storedName, type: type || "guest", token: storedToken },
    });

    setJoined(true);
  }, []);

  // 訪客登入
  const loginGuest = async () => {
    const res = await fetch(`${BACKEND}/auth/guest`, { method: "POST" });
    const data = await res.json();

    localStorage.setItem("guestToken", data.guestToken);
    localStorage.setItem("name", data.name);
    localStorage.setItem("type", "guest");

    setName(data.name);
    setGuestToken(data.guestToken);

    joinRoom(data.name, "guest", data.guestToken);
  };

  // 正式帳號登入
  const loginAccount = (username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", username);
    localStorage.setItem("type", "account");

    setName(username);
    setToken(token);

    joinRoom(username, "account", token);
  };

  // 加入聊天室
  const joinRoom = (username, type = "guest", t = "") => {
    socket.emit("joinRoom", {
      room,
      user: { name: username, type, token: t },
    });
    setJoined(true);
  };

  // 離開聊天室
  const leaveRoom = () => {
    socket.emit("leaveRoom", { room, user: { name } });

    localStorage.clear();
    window.location.href = "/login";
  };

  // ───────────────────────────────────────
  // 發送訊息
  // ───────────────────────────────────────
  const send = () => {
    if (!text || !joined) return;
    socket.emit("message", { room, message: text, user: { name }, target });
    setText("");
  };

  // ───────────────────────────────────────
  // 點播 YouTube
  // ───────────────────────────────────────
  const extractVideoID = (url) => {
    const reg = /v=([a-zA-Z0-9_-]{11})/;
    const match = url.match(reg);
    return match ? match[1] : null;
  };

  const playVideo = (url) => {
    if (!extractVideoID(url)) {
      alert("YouTube 連結錯誤");
      return;
    }
    socket.emit("playVideo", { room, url, user: name });
  };

  // ───────────────────────────────────────
  // 畫面
  // ───────────────────────────────────────
  return (
    <div className="chat-container">
      <h2>尋夢園聊天室</h2>

      {!joined ? (
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={loginGuest}>訪客登入</button>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Hi, {name}</strong>{" "}
          <button onClick={leaveRoom}>離開聊天室</button>
        </div>
      )}

      <div className="chat-main">
        {/* 聊天區 */}
        <div className="chat-box">
          <div className="chat-messages">
            {messages.map((m, i) => {
              const isSelf = m.user?.name === name;
              const isAI = aiAvatars[m.user?.name];
              const profile =
                aiProfiles[m.user?.name] || { color: isAI ? "#fff" : "#000" };

              return (
                <div
                  key={i}
                  className="message-row"
                  style={{
                    justifyContent: isSelf ? "flex-end" : "flex-start",
                  }}
                >
                  {!isSelf && isAI && (
                    <img
                      src={aiAvatars[m.user?.name]}
                      alt={m.user.name}
                      className="message-avatar"
                    />
                  )}

                  <div
                    className={`chat-message${
                      isSelf ? " self" : isAI ? " ai" : ""
                    }${m.user?.name === "系統" ? " system" : ""}`}
                    style={{
                      color:
                        m.user?.name === "系統"
                          ? "#ff5555"
                          : profile.color,
                    }}
                  >
                    <strong>
                      {m.user?.name}
                      {m.target ? ` 對 ${m.target} 說` : ""}：
                    </strong>{" "}
                    {m.message}
                  </div>
                </div>
              );
            })}
            {typing && <div className="typing">{typing}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat 輸入 */}
          <div className="chat-input">
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">發送給全部</option>
              {userList.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={!joined}
              placeholder={joined ? "輸入訊息後按 Enter 發送" : "請先登入"}
            />
            <button onClick={send} disabled={!joined}>
              發送
            </button>
          </div>

          {/* 點播影片 */}
          <div style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              placeholder="輸入 YouTube URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") playVideo(e.target.value);
              }}
            />
          </div>
        </div>

        {/* 使用者列表 */}
        <div className="user-list">
          <div className="user-list-header">
            <strong>在線人數: {userList.length}</strong>
          </div>
          <div className="user-list-content">
            {userList.map((u) => (
              <div
                key={u.id}
                className="user-item"
                onClick={() => setTarget(u.name)}
              >
                {aiAvatars[u.name] && (
                  <img
                    src={aiAvatars[u.name]}
                    alt={u.name}
                    className="user-avatar"
                  />
                )}
                <span>
                  {u.name} (Lv.{aiProfiles[u.name]?.level || u.level || 1})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 浮動播放器（同步） */}
      {currentVideo && extractVideoID(currentVideo.url) && (
        <div className="video-player-float">
          <YouTube
            videoId={extractVideoID(currentVideo.url)}
            opts={{
              width: "240",
              height: "135",
              playerVars: { autoplay: 1, controls: 1 },
            }}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
          />

          <div className="video-info">
            🎧 正在播放：{currentVideo.url}
            <br />
            由 {currentVideo.user} 點播
          </div>
        </div>
      )}
    </div>
  );
}
