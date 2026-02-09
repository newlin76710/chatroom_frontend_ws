import React from "react";
import { aiAvatars } from "./aiConfig";

const safeText = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return v;
  return v.text || v.message || v.name || "";
};

function getUserColor(user) {
  if (!user) return "#00aa00";
  if (user.gender === "男") return "#A7C7E7";
  if (user.gender === "女") return "#F8C8DC";
  return "#00aa00";
}

function MessageRow({
  m,
  name,
  AML,
  level,
  userMap,
  onSelectTarget,
}) {
  const userName = safeText(m.user?.name);
  const targetName = safeText(m.target);
  const messageText = safeText(m.message);
  const timestamp = m.timestamp || new Date().toLocaleTimeString();

  const isSelf = userName === name;
  const isSystem = userName === "系統";

  const isRelated =
    isSelf ||
    (m.mode === "private" &&
      (userName === name || targetName === name)) ||
    (isSystem && messageText?.includes(name));

  const rowClass = `message-row ${
    isSelf ? "self" : "other"
  } ${isRelated ? "related" : ""}`;

  const handleClick = (n) => {
    if (!n || n === name || isSystem) return;
    onSelectTarget?.(n);
  };

  const avatar =
    m.user?.avatar ||
    aiAvatars[userName] ||
    "/avatars/g01.gif";

  return (
    <div className={rowClass}>
      {!isSelf && !isSystem && (
        <img src={avatar} className="avatar" alt="" />
      )}

      <div className="bubble">
        {m.mode === "private" && (
          <span className="tag private">(私聊)</span>
        )}

        <span
          className="username"
          style={{ color: getUserColor(userMap[userName]) }}
          onClick={() => handleClick(userName)}
        >
          {userName}
        </span>

        {targetName && (
          <>
            <span className="arrow"> → </span>
            <span
              className="username"
              style={{ color: getUserColor(userMap[targetName]) }}
              onClick={() => handleClick(targetName)}
            >
              {targetName}
            </span>
          </>
        )}

        <span>：{messageText}</span>

        {Number(level) === Number(AML) && m.ip && (
          <span className="ip">(IP: {m.ip})</span>
        )}

        <span className="time">{timestamp}</span>
      </div>
    </div>
  );
}

export default React.memo(MessageRow);
