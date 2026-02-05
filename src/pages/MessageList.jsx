// MessageList.jsx
import { useState, useEffect, useRef } from "react";
import { aiAvatars } from "./aiConfig";
import "./MessageList.css";

const safeText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (v.text) return String(v.text);
    if (v.message) return String(v.message);
    if (v.name) return String(v.name);
    return JSON.stringify(v);
  }
  return String(v);
};

export default function MessageList({
  messages = [],
  name = "",
  level = 1,
  typing = "",
  messagesEndRef,
  onSelectTarget,
  userList = [],
}) {
  const AML = import.meta.env.VITE_ADMIN_MAX_LEVEL || 99;
  const [autoScroll, setAutoScroll] = useState(true);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const containerRef = useRef(null);

  const handleSelectUser = (selectedName) => {
    if (onSelectTarget && selectedName && selectedName !== name) {
      onSelectTarget(selectedName);
    }
  };

  const getUserColor = (userName) => {
    if (!userName) return "#00aa00";
    const user = userList.find((u) => u.name === userName);
    if (!user) return "#00aa00";
    if (user.gender === "男") return "#A7C7E7";
    if (user.gender === "女") return "#F8C8DC";
    return "#00aa00";
  };

  // 自動捲動
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewAlert(false);
    } else {
      // 偵測新訊息
      setShowNewAlert(true);
    }
  }, [messages, autoScroll]);

  // 滾動偵測：使用者手動滾動時暫停自動捲動
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const bottomThreshold = 20;
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        bottomThreshold;
      setAutoScroll(isAtBottom);
      if (isAtBottom) setShowNewAlert(false);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="message-list" ref={containerRef}>
      {messages
        .filter(
          (m) =>
            m &&
            (m.mode !== "private" ||
              m.user?.name === name ||
              m.target === name ||
              m.monitored)
        )
        .map((m, i) => {
          const userName = safeText(m.user?.name);
          const targetName = safeText(m.target);
          const messageText = safeText(m.message);
          const timestamp = m.timestamp || new Date().toLocaleTimeString();

          const isSelf = userName === name;
          const isSystem = userName === "系統";

          const isRelatedToMe =
            isSelf ||
            (m.mode === "private" &&
              (m.user?.name === name || m.target === name)) ||
            (m.mode === "publicTarget" &&
              (m.user?.name === name || m.target === name)) ||
            (isSystem && messageText?.includes(name));

          let color = "#eee";
          if (m.color) color = m.color;
          else if (isSystem && messageText?.includes("進入聊天室")) color = "#ff9900";
          else if (isSystem) color = "#BBECE2";
          else if (isSelf) color = "#fff";

          const bgColor = isRelatedToMe ? "bg-related" : "";

          const tag =
            m.mode === "private"
              ? "(私聊)"
              : m.mode === "publicTarget"
              ? "(公開對象)"
              : "";

          const enteringUserMatch = isSystem
            ? messageText.match(/^(.+) 進入聊天室$/)
            : null;
          const enteringUser = enteringUserMatch ? enteringUserMatch[1] : null;

          return (
            <div
              key={i}
              className={`message-row ${isSelf ? "self" : ""}`}
            >
              {!isSelf && !isSystem && (
                <img
                  src={m.user?.avatar || aiAvatars[userName] || "/avatars/g01.gif"}
                  alt={userName}
                  className="message-avatar"
                />
              )}

              <div className={`message-content ${bgColor}`}>
                {tag && <span className={`tag ${tag==="(私聊)" ? "private":"publicTarget"}`}>{tag}</span>}

                <span
                  className={`username ${isSystem ? "system" : ""}`}
                  style={{ color: isSystem ? color : getUserColor(userName) }}
                  onClick={() => !isSystem && handleSelectUser(userName)}
                >
                  {userName}
                </span>

                {enteringUser ? (
                  <>
                    ：
                    <span
                      style={{ fontWeight: "bold", cursor: "pointer", color }}
                      onClick={() => handleSelectUser(enteringUser)}
                    >
                      {enteringUser}
                    </span>
                    <span> 進入聊天室</span>
                  </>
                ) : (
                  <>
                    {targetName && (
                      <>
                        <span> → </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: getUserColor(targetName),
                          }}
                          onClick={() => handleSelectUser(targetName)}
                        >
                          {targetName}
                        </span>
                      </>
                    )}
                    <span>：{messageText}</span>
                  </>
                )}

                {Number(level) === Number(AML) && m.ip && (
                  <span style={{ color: "#B84A4A", marginLeft: "4px" }}>
                    (IP: {m.ip})
                  </span>
                )}

                <span className="timestamp">{timestamp}</span>
              </div>
            </div>
          );
        })}

      {typing && <div className="typing">{safeText(typing)}</div>}

      {showNewAlert && (
        <div
          className="new-message-alert"
          onClick={() => {
            messagesEndRef?.current?.scrollIntoView({ behavior: "auto" });
            setAutoScroll(true);
            setShowNewAlert(false);
          }}
        >
          ⬇ 有新訊息
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
