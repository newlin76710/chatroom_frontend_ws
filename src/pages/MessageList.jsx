// MessageList.jsx
import { aiAvatars, aiProfiles } from "./aiConfig";
import "./ChatApp.css";

const safeText = (v) => {
  if (!v) return "";
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

export default function MessageList({ messages = [], name = "", typing = "", messagesEndRef }) {
  return (
    <div className="message-list">
      {messages
        .filter(m => m && (m.mode !== "private" || m.user?.name === name || m.target === name || m.monitored))
        .map((m, i) => {
          const userName = safeText(m.user?.name);
          const targetName = safeText(m.target);
          let messageText = safeText(m.message);

          // 如果是 monitored / Lv.99，可看到 IP
          if (m.monitored && m.ip) {
            messageText += ` (IP: ${m.ip})`;
          }

          const timestamp = m.timestamp || new Date().toLocaleTimeString();
          const isSelf = userName === name;
          const isSystem = userName === "系統";
          const profile = aiProfiles[userName];

          // 訊息顏色
          let color = "#eee"; // 預設
          if (m.color) color = m.color;
          else if (isSystem) color = "#ff9900";
          else if (isSelf) color = "#fff";
          else if (profile?.gender === "男") color = "#006633";
          else if (profile?.gender === "女") color = "#ff66aa";

          // 標籤
          const tag = m.mode === "private" ? "(私聊)" :
                      m.mode === "publicTarget" ? "(公開對象)" : "";

          return (
            <div
              key={i}
              className="message-row"
              style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                marginBottom: "6px",
                backgroundColor: m.monitored ? "rgba(255,255,0,0.1)" : "transparent", // ⭐ Lv.99 背景色
                padding: m.monitored ? "2px 4px" : "0",
                borderRadius: m.monitored ? "4px" : "0",
              }}
            >
              {/* Avatar */}
              {!isSelf && !isSystem && (
                <img
                  src={m.user?.avatar && m.user?.avatar !== "" ? m.user?.avatar : aiAvatars[userName] || "/avatars/g01.gif"}
                  alt={userName}
                  className="message-avatar"
                />
              )}

              {/* 訊息文字（含時間） */}
              <div
                style={{
                  maxWidth: "75%",
                  color,
                  fontSize: "1rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.4",
                }}
              >
                {tag && (
                  <span style={{ fontSize: "0.7rem", color: "#ffd36a", marginRight: "4px" }}>
                    {tag}
                  </span>
                )}
                <span style={{ fontWeight: "bold" }}>
                  {userName}{targetName ? ` → ${targetName}` : ""}：
                </span>
                <span style={{ marginLeft: "4px" }}>
                  {messageText}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#888",
                    marginLeft: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {timestamp}
                </span>
              </div>
            </div>
          );
        })}

      {/* typing 提示 */}
      {typing && (
        <div
          className="typing fade-in"
          style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "4px" }}
        >
          {safeText(typing)}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
