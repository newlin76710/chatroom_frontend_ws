import { useEffect, useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

export default function QuickPhrasePanel({ token, onSelect }) {
  const [open, setOpen] = useState(false);
  const [phrases, setPhrases] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [value, setValue] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    const res = await fetch(`${BACKEND}/api/quick-phrases`, { headers });
    if (res.ok) setPhrases(await res.json());
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    if (!value.trim()) return;

    if (editingId) {
      await fetch(`${BACKEND}/api/quick-phrases/${editingId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ content: value }),
      });
    } else {
      await fetch(`${BACKEND}/api/quick-phrases`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: value }),
      });
    }

    setValue("");
    setEditingId(null);
    load();
  };

  const del = async (id) => {
    if (!confirm("刪除這個常用語？")) return;
    await fetch(`${BACKEND}/api/quick-phrases/${id}`, {
      method: "DELETE",
      headers,
    });
    load();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ marginLeft: "6px", fontSize: "0.8rem" }}
      >
        💬 常用語
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            right: 0,
            width: "240px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "8px",
            zIndex: 99,
          }}
        >
          {phrases.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span
                style={{ flex: 1, cursor: "pointer", fontSize: "0.8rem" }}
                onClick={() => onSelect(p.content)}
              >
                {p.content}
              </span>
              <button
                onClick={() => {
                  setEditingId(p.id);
                  setValue(p.content);
                }}
              >
                ✏️
              </button>
              <button onClick={() => del(p.id)}>🗑</button>
            </div>
          ))}

          {phrases.length < 10 && !editingId && (
            <button
              style={{ fontSize: "0.7rem", marginBottom: "4px" }}
              onClick={() => setEditingId("new")}
            >
              ➕ 新增
            </button>
          )}

          {(editingId || editingId === "new") && (
            <div style={{ marginTop: "6px" }}>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="輸入常用語"
                style={{ width: "100%", fontSize: "0.8rem" }}
              />
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <button onClick={save}>💾</button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setValue("");
                  }}
                >
                  ✖
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
