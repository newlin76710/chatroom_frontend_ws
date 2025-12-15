import { aiAvatars, aiProfiles } from "./aiConfig";

export default function MessageList({ messages, name, typing, messagesEndRef }) {
    return (
        <div className="chat-messages">
            {messages
                .filter(m => {
                    if (m.mode === "private") return m.user?.name === name || m.target === name;
                    if (m.mode === "publicTarget") return true; // 公開對象訊息大家都看得到
                    return true; // 普通公開訊息
                })
                .map((m, i) => {
                    const isSelf = m.user?.name === name;
                    const isSystem = m.user?.name === "系統";
                    const isAI = aiAvatars[m.user?.name];
                    const profile = aiProfiles[m.user?.name];
                    const msgClass = isSystem ? "chat-message system" :
                        isSelf ? "chat-message self" :
                            isAI ? "chat-message ai" :
                                "chat-message other";
                    const color = isSystem ? "#ff9900" : isSelf ? "#fff" : profile?.color || "#eee";

                    return (
                        <div key={i} className="message-row" style={{ justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                            {!isSelf && !isSystem && (
                                <img src={aiAvatars[m.user?.name] || "/avatars/default.png"} className="message-avatar" />
                            )}
                            <div className={msgClass} style={{ color, position: "relative" }}>
                                <strong>{m.user?.name}{m.target ? ` → ${m.target}` : ""}：</strong> {m.message}
                                {(m.mode === "private" || m.mode === "publicTarget") && m.target && (
                                    <span className="private-tag">{m.mode === "private" ? "私聊" : "公開對象"}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            {typing && <div className="typing">{typing}</div>}
            <div ref={messagesEndRef} />
        </div>
    );
}
