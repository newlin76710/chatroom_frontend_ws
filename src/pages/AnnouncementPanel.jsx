import { useEffect, useState, useRef } from "react";
import "./AnnouncementPanel.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const AML = import.meta.env.VITE_ADMIN_MAX_LEVEL || 99;

export default function AnnouncementPanel({ open, onClose, myLevel, token }) {
  const [announcements, setAnnouncements] = useState([]); // 存所有公告
  const [currentIndex, setCurrentIndex] = useState(0);    // 顯示第幾則
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const isAdmin = myLevel >= AML;

  const pos = useRef({ x: 20, y: 80, offsetX: 0, offsetY: 0, dragging: false });

  /* ===== 載入公告 ===== */
  useEffect(() => {
    if (!open) return;

    fetch(`${BACKEND}/api/announcement`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAnnouncements(data);
        else if (data) setAnnouncements([data]);
        else setAnnouncements([]);
        setCurrentIndex(0);
      })
      .catch(() => alert("載入公告失敗"));
  }, [open]);

  /* ===== 儲存公告（管理員） ===== */
  const save = async () => {
    if (!isAdmin) return;

    setLoading(true);
    const current = announcements[currentIndex];

    const url = current.id
      ? `${BACKEND}/api/announcement/update`
      : `${BACKEND}/api/announcement/create`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: current.id,
        title: current.title || "",
        content: current.content || "",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("儲存失敗");
      return;
    }

    const saved = await res.json(); // 後端回傳的最新公告

    // 更新本地 state，確保 index 指向最新公告
    setAnnouncements(prev => {
      const newArr = [...prev];
      if (current.id) {
        // 更新現有公告
        newArr[currentIndex] = saved;
      } else {
        // 新增公告
        newArr.push(saved);
        setCurrentIndex(newArr.length - 1); // 跳到新增公告
      }
      return newArr;
    });
    onClose();
    alert("儲存成功");
  };

  /* ===== 新增公告 ===== */
  const addAnnouncement = () => {
    if (!isAdmin) return;
    if (announcements.length >= 10) return; // 最多 10 則
    const newAnn = { title: "新公告", content: "", updated_by: myLevel, updated_at: new Date() };
    setAnnouncements([...announcements, newAnn]);
    setCurrentIndex(announcements.length); // 跳到新增的公告
  };

  /* ===== 刪除公告 ===== */
  const deleteAnnouncement = async () => {
    if (!isAdmin) return;
    if (announcements.length <= 1) return; // 最後一筆不能刪

    const current = announcements[currentIndex];
    if (!current.id) {
      // 如果是還沒儲存的公告，直接從 state 移除
      const newAnnouncements = announcements.filter((_, idx) => idx !== currentIndex);
      setAnnouncements(newAnnouncements);
      setCurrentIndex(i => Math.max(i - 1, 0));
      return;
    }

    if (!confirm("確定要刪除這則公告嗎？")) return;

    try {
      const res = await fetch(`${BACKEND}/api/announcement/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: current.id }),
      });

      if (!res.ok) {
        alert("刪除失敗");
        return;
      }

      // 後端刪除成功，前端更新 state
      const newAnnouncements = announcements.filter((_, idx) => idx !== currentIndex);
      setAnnouncements(newAnnouncements);
      setCurrentIndex(i => Math.max(i - 1, 0));
      alert("公告已刪除");
    } catch (err) {
      console.error(err);
      alert("刪除失敗");
    }
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

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div
      ref={panelRef}
      className="announcement-floating"
      style={{ left: pos.current.x, top: pos.current.y }}
    >
      <div className="announcement-floating-header" onMouseDown={onMouseDown}>
        📢 公告
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}>◀</button>
          <button onClick={() => setCurrentIndex(i => Math.min(i + 1, announcements.length - 1))}>▶</button>
          {isAdmin && (
            <>
              <button onClick={addAnnouncement}>➕</button>
              <button onClick={deleteAnnouncement} disabled={announcements.length <= 1}>🗑️</button>
            </>
          )}
        </div>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="announcement-floating-content">
        {isAdmin ? (
          <>
            <input
              type="text"
              value={currentAnnouncement?.title || ""}
              onChange={(e) => {
                const newAnnouncements = [...announcements];
                newAnnouncements[currentIndex] = {
                  ...newAnnouncements[currentIndex],
                  title: e.target.value,
                };
                setAnnouncements(newAnnouncements);
              }}
              placeholder="標題"
              style={{
                marginBottom: "6px",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "#2b2b2b",
                color: "#fff",
                width: "100%",
                boxSizing: "border-box",
                fontWeight: "bold",
              }}
            />
            <textarea
              value={currentAnnouncement?.content || ""}
              onChange={(e) => {
                const newAnnouncements = [...announcements];
                newAnnouncements[currentIndex] = {
                  ...newAnnouncements[currentIndex],
                  content: e.target.value,
                };
                setAnnouncements(newAnnouncements);
              }}
              rows={8}
              placeholder="公告內容"
            />
            <button className="save-btn" onClick={save} disabled={loading}>
              💾 儲存
            </button>
          </>
        ) : (
          <>
            <strong>{currentAnnouncement?.title || "暫無公告"}</strong>
            <pre>{currentAnnouncement?.content || "目前沒有公告"}</pre>
          </>
        )}
      </div>
    </div>
  );
}
