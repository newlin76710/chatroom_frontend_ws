import { useEffect, useState, useRef } from "react";
import "./AnnouncementPanel.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function AnnouncementPanel({ open, onClose, myLevel, token }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = myLevel >= 99;
  const panelRef = useRef(null);

  const pos = useRef({ x: 20, y: 80, offsetX: 0, offsetY: 0, dragging: false });

  /* ===== 載入公告 ===== */
  useEffect(() => {
    if (!open) return;

    fetch(`${BACKEND}/api/announcement`)
      .then(res => res.json())
      .then(data => {
        if (data?.content) setContent(data.content);
      })
      .catch(() => alert("載入公告失敗"));
  }, [open]);

  /* ===== 儲存公告 ===== */
  const save = async () => {
    if (!isAdmin) return;

    setLoading(true);
    const res = await fetch(`${BACKEND}/api/announcement/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    setLoading(false);

    if (!res.ok) {
      alert("儲存失敗");
      return;
    }

    alert("公告已更新");
    onClose();
  };

  /* ===== 拖動事件 ===== */
  const onMouseDown = (e) => {
    pos.current.dragging = true;
    pos.current.offsetX = e.clientX - pos.current.x;
    pos.current.offsetY = e.clientY - pos.current.y;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!pos.current.dragging) return;
    pos.current.x = e.clientX - pos.current.offsetX;
    pos.current.y = e.clientY - pos.current.offsetY;
    if (panelRef.current) {
      panelRef.current.style.left = pos.current.x + "px";
      panelRef.current.style.top = pos.current.y + "px";
    }
  };

  const onMouseUp = () => {
    pos.current.dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="announcement-floating"
      style={{ left: pos.current.x, top: pos.current.y }}
    >
      <div className="announcement-floating-header" onMouseDown={onMouseDown}>
        📢 公告
        <button onClick={onClose}>✖</button>
      </div>

      <div className="announcement-floating-content">
        {isAdmin ? (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
            <button className="save-btn" onClick={save} disabled={loading}>
              💾 儲存
            </button>
          </>
        ) : (
          <pre>{content}</pre>
        )}
      </div>
    </div>
  );
}
