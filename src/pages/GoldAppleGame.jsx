// GoldAppleGame.jsx — 撈金蘋果遊戲覆蓋層
// 遊戲一：多顆金蘋果，全場搶，1 分鐘結算
// 遊戲二：一顆大金蘋果，第一個點到獲得全部獎勵
import { useState, useEffect, useRef, useCallback } from "react";
import "./GoldAppleGame.css";

// ─── 常數 ─────────────────────────────────────────────────────────────────────
const SIZE1  = 40;   // px — 遊戲一蘋果尺寸
const SIZE2  = 80;   // px — 遊戲二蘋果尺寸
const SPD_LO = 5;    // 最低速度（像素/幀 @60fps）
const SPD_HI = 9;    // 最高速度

function randSpd(scale = 1) {
  const s = (SPD_LO + Math.random() * (SPD_HI - SPD_LO)) * scale;
  const a = Math.random() * Math.PI * 2;
  return { vx: Math.cos(a) * s, vy: Math.sin(a) * s };
}

function randPos(W, H, size) {
  return {
    x: size + Math.random() * (W - size * 2),
    y: size + Math.random() * (H - size * 2),
  };
}

// ─── 主元件 ───────────────────────────────────────────────────────────────────
export default function GoldAppleGame({ socket, token, name, setApples }) {
  // ── 遊戲階段: idle | game1 | game2 | result1 | result2
  const [phase, setPhase] = useState("idle");

  // ── 遊戲一
  const [g1AppleIds, setG1AppleIds] = useState([]); // React 控制 DOM 渲染
  const [g1Reward,   setG1Reward]   = useState(1);
  const [g1Result,   setG1Result]   = useState(null); // catches map 結束時

  // ── 遊戲二
  const [g2Reward, setG2Reward] = useState(25);
  const [g2Result, setG2Result] = useState(null); // { winner, reward }

  // ── 共用
  const [timeLeft, setTimeLeft] = useState(0);
  const [lateMsg,  setLateMsg]  = useState("");

  // ── Refs（避免 re-render）
  const containerRef  = useRef(null);
  const physicsRef    = useRef({});         // id → { id, x, y, vx, vy }
  const domRefs       = useRef({});         // id → DOM element（遊戲一）
  const apple2WrapRef = useRef(null);       // 遊戲二蘋果的包裝 div
  const apple2Physics = useRef({ x: 200, y: 200, vx: 7, vy: 6 });
  const animRef       = useRef(null);
  const timerRef      = useRef(null);
  const phaseRef      = useRef("idle");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ─── 動畫迴圈 ──────────────────────────────────────────────────────────────
  const startAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    function loop() {
      const el = containerRef.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;

      if (phaseRef.current === "game1") {
        // 更新所有蘋果位置
        for (const p of Object.values(physicsRef.current)) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0)          { p.x = 0;          p.vx =  Math.abs(p.vx); }
          if (p.x > W - SIZE1)  { p.x = W - SIZE1;  p.vx = -Math.abs(p.vx); }
          if (p.y < 0)          { p.y = 0;           p.vy =  Math.abs(p.vy); }
          if (p.y > H - SIZE1)  { p.y = H - SIZE1;  p.vy = -Math.abs(p.vy); }
          const dom = domRefs.current[p.id];
          if (dom) dom.style.transform = `translate(${p.x}px, ${p.y}px)`;
        }

      } else if (phaseRef.current === "game2") {
        const p = apple2Physics.current;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0)          { p.x = 0;          p.vx =  Math.abs(p.vx); }
        if (p.x > W - SIZE2)  { p.x = W - SIZE2;  p.vx = -Math.abs(p.vx); }
        if (p.y < 0)          { p.y = 0;           p.vy =  Math.abs(p.vy); }
        if (p.y > H - SIZE2)  { p.y = H - SIZE2;  p.vy = -Math.abs(p.vy); }
        if (apple2WrapRef.current) {
          apple2WrapRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
        }
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
  }, []);

  const stopAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  // ─── 倒計時 ────────────────────────────────────────────────────────────────
  const startTimer = useCallback((secs) => {
    clearInterval(timerRef.current);
    setTimeLeft(secs);
    let left = secs;
    timerRef.current = setInterval(() => {
      left--;
      setTimeLeft(left);
      if (left <= 0) clearInterval(timerRef.current);
    }, 1000);
  }, []);

  // ─── Socket 事件 ──────────────────────────────────────────────────────────
  useEffect(() => {
    // ── 遊戲一開始 ──
    const onG1Start = ({ duration, appleIds, reward }) => {
      setG1Reward(reward);
      setG1Result(null);
      setLateMsg("");

      const W = window.innerWidth;
      const H = window.innerHeight;
      physicsRef.current = {};
      appleIds.forEach(id => {
        const { x, y } = randPos(W, H, SIZE1);
        physicsRef.current[id] = { id, ...randSpd(), x, y };
      });

      setG1AppleIds(appleIds);
      setPhase("game1");
      startTimer(duration);
      startAnim();
    };

    // ── 遊戲一有人撈到 ──
    const onCaught1 = ({ appleId, newAppleId }) => {
      // 移除舊蘋果的物理
      delete physicsRef.current[appleId];
      if (domRefs.current[appleId]) delete domRefs.current[appleId];

      // 新蘋果的物理
      physicsRef.current[newAppleId] = {
        id: newAppleId,
        x: SIZE1 + Math.random() * (window.innerWidth  - SIZE1 * 2),
        y: SIZE1 + Math.random() * (window.innerHeight - SIZE1 * 2),
        ...randSpd(),
      };

      // 更新 React state（控制 DOM）
      setG1AppleIds(prev => [...prev.filter(id => id !== appleId), newAppleId]);
    };

    // ── 遊戲一結束 ──
    const onG1End = ({ catches }) => {
      stopAnim();
      clearInterval(timerRef.current);
      setG1Result(catches || {});
      setG1AppleIds([]);
      physicsRef.current = {};
      domRefs.current = {};
      setPhase("result1");
    };

    // ── 遊戲二開始 ──
    const onG2Start = ({ duration, reward }) => {
      setG2Reward(reward);
      setG2Result(null);
      setLateMsg("");

      const W = window.innerWidth;
      const H = window.innerHeight;
      const { x, y } = randPos(W, H, SIZE2);
      apple2Physics.current = { x, y, ...randSpd(1.3) }; // 略快

      setPhase("game2");
      startTimer(duration);
      startAnim();
    };

    // ── 遊戲二有人贏 ──
    const onG2Won = ({ winner, reward }) => {
      setG2Result({ winner, reward });
      if (winner === name && typeof setApples === "function") {
        setApples(prev => prev + reward);
      }
    };

    // ── 遊戲二慢了 ──
    const onG2Late = ({ winner, secondsLate }) => {
      setLateMsg(`已被 ${winner} 搶先 ${secondsLate} 秒`);
      setTimeout(() => setLateMsg(""), 3500);
    };

    // ── 遊戲二結束 ──
    const onG2End = () => {
      stopAnim();
      clearInterval(timerRef.current);
      setPhase("result2");
    };

    socket.on("goldGame1Start",   onG1Start);
    socket.on("goldAppleCaught1", onCaught1);
    socket.on("goldGame1End",     onG1End);
    socket.on("goldGame2Start",   onG2Start);
    socket.on("goldGame2Won",     onG2Won);
    socket.on("goldGame2Late",    onG2Late);
    socket.on("goldGame2End",     onG2End);

    return () => {
      socket.off("goldGame1Start",   onG1Start);
      socket.off("goldAppleCaught1", onCaught1);
      socket.off("goldGame1End",     onG1End);
      socket.off("goldGame2Start",   onG2Start);
      socket.off("goldGame2Won",     onG2Won);
      socket.off("goldGame2Late",    onG2Late);
      socket.off("goldGame2End",     onG2End);
    };
  }, [socket, name, setApples, startAnim, stopAnim, startTimer]);

  // ─── 離開時清理 ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAnim();
      clearInterval(timerRef.current);
    };
  }, [stopAnim]);

  // ─── 撈蘋果動作 ───────────────────────────────────────────────────────────
  const handleCatch1 = useCallback((id, e) => {
    e.stopPropagation();
    socket.emit("catchApple1", { token, appleId: id });
  }, [socket, token]);

  const handleCatch2 = useCallback((e) => {
    e.stopPropagation();
    socket.emit("catchApple2", { token });
  }, [socket, token]);

  // 點擊結果卡片可提前關閉
  const dismissResult = useCallback(() => {
    setPhase("idle");
    setG1Result(null);
    setG2Result(null);
    setLateMsg("");
  }, []);

  // ─── 沒有遊戲時不渲染 ────────────────────────────────────────────────────
  if (phase === "idle") return null;

  // ─── 結果畫面 ─────────────────────────────────────────────────────────────
  if (phase === "result1") {
    const entries = Object.entries(g1Result || {}).sort((a, b) => b[1] - a[1]);
    return (
      <div className="gag-overlay" onClick={dismissResult}>
        <div className="gag-result" onClick={e => e.stopPropagation()}>
          <h2>🍎 遊戲結束！</h2>
          {entries.length > 0 ? (
            <>
              <p>本次撈金蘋果得獎名單：</p>
              <ul>
                {entries.map(([uname, count]) => (
                  <li key={uname} className={uname === name ? "me" : ""}>
                    {uname}：{count} 顆{uname === name ? " 🎉" : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>本次沒有人撈到金蘋果…</p>
          )}
          <p className="gag-dismiss-hint">點擊任意處關閉</p>
        </div>
      </div>
    );
  }

  if (phase === "result2") {
    const won = g2Result?.winner;
    return (
      <div className="gag-overlay" onClick={dismissResult}>
        <div className="gag-result" onClick={e => e.stopPropagation()}>
          {won ? (
            <>
              <h2>🎉 有人撈到大金蘋果！</h2>
              <p>
                <span className="gag-winner-name">{won}</span>
                {" "}獲得 <strong style={{ color: "gold" }}>{g2Result.reward ?? g2Reward}</strong> 顆金蘋果！
                {won === name && <span style={{ display: "block", marginTop: 8, color: "#7fff7f" }}>恭喜你！</span>}
              </p>
            </>
          ) : (
            <>
              <h2>😢 無人撈到大金蘋果</h2>
              <p>金蘋果趁亂逃走了…</p>
            </>
          )}
          <p className="gag-dismiss-hint">點擊任意處關閉</p>
        </div>
      </div>
    );
  }

  // ─── 遊戲進行中畫面 ───────────────────────────────────────────────────────
  return (
    <div className="gag-overlay" ref={containerRef}>

      {/* 倒計時 HUD */}
      <div className="gag-hud">
        <span className="gag-timer">{timeLeft}</span>
        <span className="gag-timer-unit">秒</span>
        {phase === "game1" && (
          <span className="gag-hint">點擊金蘋果來撈！每顆 {g1Reward} 個🍎</span>
        )}
        {phase === "game2" && (
          <span className="gag-hint">第一個點到大金蘋果得 {g2Reward} 個🍎！</span>
        )}
      </div>

      {/* 「慢了 N 秒」浮層 */}
      {lateMsg && <div className="gag-late">{lateMsg}</div>}

      {/* 遊戲一：多顆蘋果 */}
      {phase === "game1" && g1AppleIds.map(id => (
        <div
          key={id}
          className="gag-apple-wrap"
          ref={el => { if (el) domRefs.current[id] = el; }}
          onClick={e => handleCatch1(id, e)}
        >
          <img
            src="/gifts/gold_apple.gif"
            className="gag-apple-img"
            alt="金蘋果"
            draggable={false}
          />
        </div>
      ))}

      {/* 遊戲二：一顆大蘋果 */}
      {phase === "game2" && (
        <div
          className="gag-apple-wrap"
          ref={apple2WrapRef}
          onClick={handleCatch2}
        >
          <img
            src="/gifts/gold_apple.gif"
            className="gag-apple-img big"
            alt="大金蘋果"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
