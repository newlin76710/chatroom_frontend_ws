import { useState } from "react";
import AdminLoginLogPanel from "./AdminLoginLogPanel";
import MessageLogPanel from "./MessageLogPanel";
import "./AdminToolPanel.css";

export default function AdminToolPanel({ myLevel, minLevel, token }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("login"); // login | message

  if (myLevel < minLevel) return null;

  return (
    <div className="admin-tool">
      {/* 🛡 管理按鈕 */}
      <button className="admin-btn" onClick={() => setOpen(o => !o)}>
        🛡管理
      </button>

      {open && (
        <div className="admin-popup">
          {/* Tabs */}
          <div className="admin-tabs">
            <button
              className={tab === "login" ? "active" : ""}
              onClick={() => setTab("login")}
            >
              登入紀錄
            </button>
            <button
              className={tab === "message" ? "active" : ""}
              onClick={() => setTab("message")}
            >
              發言紀錄
            </button>
          </div>

          {/* Content */}
          <div className="admin-content">
            {tab === "login" && (
              <AdminLoginLogPanel token={token} />
            )}

            {tab === "message" && (
              <MessageLogPanel token={token} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
