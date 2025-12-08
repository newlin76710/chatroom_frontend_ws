import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function LoginGuest() {
  const navigate = useNavigate();

  const guestLogin = async () => {
    try {
      const oldToken = localStorage.getItem("guestToken");
      const res = await fetch(`${BACKEND}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "訪客登入失敗");

      localStorage.setItem("guestToken", data.guestToken);
      localStorage.setItem("name", data.name);

      // 可選：驗證 token（呼叫 /auth/guest/verify）
      // await fetch(`${BACKEND}/auth/guest/verify`, { ... })

      navigate("/chat");
    } catch (e) {
      alert("訪客登入失敗：" + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
      <h2>匿名訪客登入</h2>
      <p>按一下即可產生或延用訪客帳號，系統會把訪客名稱綁定到資料庫。</p>
      <button onClick={guestLogin} style={{ padding: "10px 16px" }}>
        以訪客身分進入
      </button>
    </div>
  );
}
