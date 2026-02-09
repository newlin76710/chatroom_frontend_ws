import { useEffect, useRef, useMemo } from "react";
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

// ====== 單行訊息組件 ======
function MessageRow({ m, name, userList, AML, onSelectUser }) {
  const userName = safeText(m.user?.name);
  const targetName = safeText(m.target);
  const messageText = safeText(m.message);
  const timestamp = m.timestamp || new Date().toLocaleTimeString();

  const isSelf = userName === name;
  const isSystem = userName === "系統";

  const isRelatedToMe =
    isSelf ||
    (m.mode === "private" && (m.user?.name === name || m.target === name)) ||
    (m.mode === "publicTarget" && (m.user?.name === name || m.target === name)) ||
    (isSystem && messageText?.includes(name));

  const color = useMemo(() => {
    if (m.color) return m.color;
    if (isSystem && messageText?.includes("進入聊天室")) return "#ff9900";
    if (isSystem) return "#BBECE2";
    if (isSelf) return "#fff";
    return "#eee";
  }, [m.color, isSystem, messageText, isSelf]);

  const bgColor = isRelatedToMe ? "#004477" : "transparent";

  const tag = m.mode === "private" ? "(私聊)" : "";

  const getUserColor = (userName) => {
    if (!userName) return "#00aa00";
    const user = userList.find((u) => u.name === userName);
    if (!user) return "#00aa00";
    if (user.gender === "男") return "#A7C7E7";
    if (user.gender === "女") return "#F8C8DC";
    return "#00aa00";
  };

  const handleClickUser = (u) => {
    if (onSelectUser && u && u !== name) onSelectUser(u);
  };

  return (
    <div
      className="message-row"
      style={{
        display: "flex",
        justifyContent: isSelf ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        marginBottom: 6,
      }}
    >
      {!isSelf && !isSystem && (
        <img
          src={m.user?.avatar || aiAvatars[userName] || "/avatars/g01.gif"}
          alt={userName}
          className="message-avatar"
        />
      )}

      <div
        className="message-content"
        style={{
          maxWidth: "75%",
          color,
          background: bgColor,
          padding: isRelatedToMe ? "6px 10px" : 0,
          borderRadius: isRelatedToMe ? 8 : 0,
          fontSize: "1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
      >
        {tag && (
          <span style={{ fontSize: 12, color: "#e60909", marginRight: 4 }}>
            {tag}
          </span>
        )}

        <span
          style={{
            fontWeight: "bold",
            cursor: isSystem ? "default" : "pointer",
            color: isSystem ? color : getUserColor(userName),
          }}
          onClick={() => !isSystem && handleClickUser(userName)}
        >
          {userName}
        </span>

        {targetName && !isSystem && (
          <>
            <span> → </span>
            <span
              style={{
                fontWeight: "bold",
                cursor: "pointer",
                color: getUserColor(targetName),
              }}
              onClick={() => handleClickUser(targetName)}
            >
              {targetName}
            </span>
          </>
        )}

        <span>：{messageText}</span>

        {Number(AML) === Number(m.level) && m.ip && (
          <span style={{ color: "#B84A4A", marginLeft: 4 }}>(IP: {m.ip})</span>
        )}

        <span
          style={{
            fontSize: 12,
            color: "#888",
            marginLeft: 6,
            whiteSpace: "nowrap",
          }}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}

// ====== 主組件 ======
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

  const containerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  // 滾動監控
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120;
      shouldAutoScrollRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 自動滾動
  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];
    const isSelf = lastMsg?.user?.name === name;

    if (isSelf || shouldAutoScrollRef.current) {
      messagesEndRef?.current?.scrollIntoView({
        behavior: isSelf ? "auto" : "smooth",
      });
    }
  }, [messages, name]);

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m &&
          (m.mode !== "private" ||
            m.user?.name === name ||
            m.target === name ||
            m.monitored)
      ),
    [messages, name]
  );

  return (
    <div ref={containerRef} className="message-list">
      {filteredMessages.map((m, i) => (
        <MessageRow
          key={i}
          m={m}
          name={name}
          userList={userList}
          AML={AML}
          onSelectUser={onSelectTarget}
        />
      ))}

      {typing && (
        <div className="typing fade-in" style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>
          {safeText(typing)}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
