// MessageList.jsx
import { aiProfiles, aiAvatars } from "./aiConfig";
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

/**
 * props:
 * - messages: 訊息陣列
 * - name: 目前使用者名稱
 * - typing: 正在輸入訊息的文字
 * - messagesEndRef: 用於滾動到底部
 * - onSelectTarget: 點擊使用者或目標名稱的 callback (name: string) => void
 */
export default function MessageList({
  messages = [],
  name = "",
  typing = "",
  messagesEndRef,
  onSelectTarget,
}) {
  return (
    <div className="message-list">
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
          const profile = aiProfiles[userName];

          // 訊息顏色
          let color = "#eee"; // 預設
          if (m.color) color = m.color;
          else if (isSystem && messageText?.includes("進入聊天室")) color = "#ff9900";
          else if (isSystem) color = "#BBECE2";
          else if (isSelf) color = "#fff";
          else if (profile?.gender === "男") color = "#006633";
          else if (profile?.gender === "女") color = "#ff66aa";

          // 標籤
          const tag =
            m.mode === "private"
              ? "(私聊)"
              : m.mode === "publicTarget"
              ? "(公開對象)"
              : "";

          // 點擊 handler
          const handleSelectUser = (selectedName) => {
            if (onSelectTarget && selectedName && selectedName !== name) {
              onSelectTarget(selectedName);
            }
          };

          return (
            <div
              key={i}
              className="message-row"
              style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                marginBottom: "6px",
              }}
            >
              {/* Avatar */}
              {!isSelf && !isSystem && (
                <img
                  src={
                    m.user?.avatar && m.user?.avatar !== ""
                      ? m.user?.avatar
                      : aiAvatars[userName] || "/avatars/g01.gif"
                  }
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
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#ffd36a",
                      marginRight: "4px",
                    }}
                  >
                    {tag}
                  </span>
                )}
                <span
                  style={{ fontWeight: "bold", cursor: "pointer" }}
                  onClick={() => handleSelectUser(userName)}
                  title="點擊選擇此使用者為對象"
                >
                  {userName}
                </span>
                {targetName && (
                  <>
                    <span> → </span>
                    <span
                      style={{ fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => handleSelectUser(targetName)}
                      title="點擊選擇此使用者為對象"
                    >
                      {targetName}
                    </span>
                  </>
                )}
                <span style={{ marginLeft: "4px" }}>
                  ：{messageText}
                  {/* 管理員顯示 IP */}
                  {m.monitored && m.ip && (
                    <span style={{ color: "#ff5555", marginLeft: "4px" }}>
                      (IP: {m.ip})
                    </span>
                  )}
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
