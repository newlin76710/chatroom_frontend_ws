import { aiAvatars, aiProfiles } from "./aiConfig";

export default function MessageList({ messages, name, typing, messagesEndRef }) {
  return (
    <div className="chat-messages">
      {messages.map((m, i) => {
        const isSelf = m.user?.name === name;
        const isSystem = m.user?.name === "系統";
        const isAI = aiAvatars[m.user?.name];
        const profile = aiProfiles[m.user?.name];

        // 判斷訊息類型
        let msgClass = "chat-message other";
        if (isSystem) msgClass = "chat-message system";
        else if (isSelf) msgClass = "chat-message self";
        else if (isAI) msgClass = "chat-message ai";
        if (m.mode === "private" && (m.user?.name === name || m.target === name)) msgClass += " private-msg";
        else if (m.mode === "public" && m.target) msgClass += " public-target";

        const color = isSystem ? "#ff9900" : isSelf ? "#fff" : profile?.color || "#eee";

        // 私聊訊息不屬於自己或對象就不顯示
        if (m.mode === "private" && !(m.user?.name === name || m.target === name)) return null;

        return (
          <div key={i} className="message-row" style={{ justifyContent: isSelf ? "flex-end" : "flex-start" }}>
            {!isSelf && !isSystem && (
              <img
                src={aiAvatars[m.user?.name] || "/avatars/default.png"}
                className="message-avatar"
                style={{ width: 24, height: 24 }}
              />
            )}
            <div className={msgClass} style={{ color }}>
              <strong>
                {m.user?.name} {m.target ? `→ ${m.target}` : ""}：
              </strong>
              {" "}{m.message}
            </div>
          </div>
        );
      })}
      {typing && <div className="typing">{typing}</div>}
      <div ref={messagesEndRef} />
    </div>
  );
}
