// MessageList.jsx
import { useState, useRef, useEffect } from "react";
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
  const listRef = useRef(null);

  const [scrollLocked, setScrollLocked] = useState(false);
  const lockedScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef(null);

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

  // 用戶手動滾動時紀錄位置（只有鎖定滾動才生效）
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollLocked) return;

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (listRef.current) {
          lockedScrollTopRef.current = listRef.current.scrollTop;
          console.log("User scroll stopped, recorded position:", lockedScrollTopRef.current);
        }
      }, 100); // 100ms 無滾動才算停止
    };

    const listEl = listRef.current;
    listEl?.addEventListener("scroll", handleScroll);

    return () => listEl?.removeEventListener("scroll", handleScroll);
  }, [scrollLocked]);

  // 新訊息加入時控制滾動
  useEffect(() => {
    if (!listRef.current) return;

    if (scrollLocked) {
      // 🔹 還原到鎖定位置，不更新 lockedScrollTopRef
      listRef.current.scrollTop = lockedScrollTopRef.current;
      console.log("Messages updated, restoring locked scroll:", lockedScrollTopRef.current);
    } else {
      // 🔹 自動滾到底
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, scrollLocked]);

  return (
    <div className="message-list-wrapper">
      {/* <button
        className="scroll-toggle-btn"
        onClick={() => setScrollLocked((prev) => !prev)}
      >
        {scrollLocked ? "解除滾動鎖定" : "鎖定滾動"}
      </button> */}

      <div className="message-list" ref={listRef}>
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

            const color = m.color
              ? m.color
              : isSystem && messageText?.includes("進入聊天室")
              ? "#ff9900"
              : isSystem
              ? "#BBECE2"
              : isSelf
              ? "#fff"
              : "#eee";

            const bgClass = isRelatedToMe ? "message-bg-related" : "";

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
              <div key={i} className={`message-row ${isSelf ? "self" : ""}`}>
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

                <div className={`message-content ${bgClass}`}>
                  {tag && (
                    <span className={`message-tag ${tag === "(私聊)" ? "private" : "public"}`}>
                      {tag}
                    </span>
                  )}

                  <span
                    className={`message-username ${isSystem ? "system" : ""}`}
                    style={{ color: isSystem ? color : getUserColor(userName) }}
                    onClick={() => !isSystem && handleSelectUser(userName)}
                  >
                    {userName}
                  </span>

                  {enteringUser ? (
                    <>
                      ：
                      <span
                        className="message-username"
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
                            className="message-username"
                            onClick={() => handleSelectUser(targetName)}
                            style={{ color: getUserColor(targetName) }}
                          >
                            {targetName}
                          </span>
                        </>
                      )}
                      <span>：{messageText}</span>
                    </>
                  )}

                  {Number(level) === Number(AML) && m.ip && (
                    <span className="message-ip">(IP: {m.ip})</span>
                  )}

                  <span className="message-time">{timestamp}</span>
                </div>
              </div>
            );
          })}

        {typing && <div className="typing fade-in">{safeText(typing)}</div>}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
