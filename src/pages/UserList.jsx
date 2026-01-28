// UserList.jsx
import React from "react";
import { aiAvatars } from "./aiConfig";

export default function UserList({
  userList = [],
  target,
  setTarget,
  setChatMode,
  userListCollapsed,
  setUserListCollapsed,
  kickUser,
  myLevel,
  myName
}) {
  const formatLv = (lv) => String(lv).padStart(2, "0");

  return (
    <div className={`user-list ${userListCollapsed ? "collapsed" : ""}`}>
      <div
        className="user-list-header"
        onClick={() => setUserListCollapsed(!userListCollapsed)}
      >
        在線：{userList.filter(u => u.type !== "AI").length}
      </div>

      {!userListCollapsed &&
        userList
          .filter(u => u.type !== "AI") // 不顯示 AI
          .map((u, idx) => {
            const avatarUrl = u.avatar || aiAvatars[u.name];

            const canKick =
              myLevel >= 91 &&          // 自己 91 等以上
              u.level < myLevel &&      // 只能踢比自己低等
              u.name !== myName &&      // 不能踢自己
              kickUser;

            return (
              <div
                key={`${u.name}-${idx}`}
                className={`user-item ${u.name === target ? "selected" : ""}`}
                onClick={() => {
                  setChatMode("private");
                  setTarget(u.name);
                }}
              >
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={u.name}
                    className="user-avatar"
                  />
                )}

                {u.name} [Lv.{formatLv(u.level)}] ({u.gender})

                {canKick && (
                  <button
                    className="kick-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      kickUser(u.name);
                    }}
                  >
                    踢出
                  </button>
                )}
              </div>
            );
          })}
    </div>
  );
}
