// AdminLoginLogPanel.jsx
import { useEffect, useState } from "react";
import "./AdminLoginLogPanel.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

export default function AdminLoginLogPanel({ myName, myLevel, minLevel, token }) {
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / pageSize);

  // 權限不足直接不 render
  if (!token || myLevel < minLevel) return null;

  const loadLogs = async (pageNum = 1) => {
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND}/admin/login-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ username: myName, page: pageNum, pageSize }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "權限不足或查詢失敗");
        return;
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setPage(data.page || 1);
      setTotalCount(data.totalCount || data.logs?.length || 0);
    } catch (err) {
      console.error(err);
      alert("查詢登入紀錄失敗");
    }
  };

  const handleOpen = () => {
    if (!token) {
      alert("尚未登入或權限不足");
      return;
    }
    setOpen(true);
    loadLogs(1);
  };

  const handlePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    loadLogs(newPage);
  };

  return (
    <>
      <button className="admin-btn" onClick={handleOpen}>🛡管理</button>

      {open && (
        <div className="admin-overlay" onClick={() => setOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-header">
              <h3>登入紀錄</h3>
              <button onClick={() => setOpen(false)}>✖</button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>帳號</th>
                    <th>類型</th>
                    <th>IP</th>
                    <th>結果</th>
                    <th>原因</th>
                    <th>時間</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td>{l.username}</td>
                      <td>{l.login_type}</td>
                      <td>{l.ip_address}</td>
                      <td>{l.success ? "✅" : "❌"}</td>
                      <td>{l.fail_reason || "-"}</td>
                      <td>{new Date(l.login_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>無資料</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 分頁 */}
              <div className="admin-pagination">
                <button onClick={() => handlePage(page - 1)} disabled={page <= 1}>上一頁</button>
                <span>第 {page} / {totalPages || 1} 頁</span>
                <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>下一頁</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
