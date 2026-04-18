// ClawMachineGame.jsx — 夾蘋果機遊戲
// Socket events:
//   in:  clawGameStart  { duration, reward, speed, difficulty }
//   in:  clawDropResult { success, caught }
//   in:  clawGameEnd    { scores: { [name]: count } }
//   out: clawDropClaw   { token, position }   (0–1)
import { useState, useEffect, useRef, useCallback } from "react";
import "./ClawMachineGame.css";

// 基準下爪速度（dropSpeed=100 時的值，已比原版快 1.5 倍）
const BASE_DROP_MS = 600;
const BASE_HOLD_MS = 500;
const BASE_RISE_MS = 533;
const APPLE_IMG = "/gifts/gold_apple.gif";

// 蘋果初始排列：x=左邊距%，bot=底部距%，dur/delay=滾動動畫參數
const APPLE_INIT = [
  { id: 0,  x: 7,  bot: 4,  dur: 2.4, delay: 0.0 },
  { id: 1,  x: 21, bot: 3,  dur: 2.8, delay: 0.5 },
  { id: 2,  x: 35, bot: 5,  dur: 2.2, delay: 0.9 },
  { id: 3,  x: 49, bot: 4,  dur: 3.1, delay: 0.3 },
  { id: 4,  x: 63, bot: 3,  dur: 2.6, delay: 0.7 },
  { id: 5,  x: 77, bot: 5,  dur: 2.3, delay: 1.1 },
  { id: 6,  x: 14, bot: 23, dur: 2.7, delay: 0.4 },
  { id: 7,  x: 28, bot: 22, dur: 2.5, delay: 0.8 },
  { id: 8,  x: 42, bot: 24, dur: 2.9, delay: 0.1 },
  { id: 9,  x: 56, bot: 23, dur: 2.1, delay: 0.6 },
  { id: 10, x: 70, bot: 22, dur: 2.6, delay: 1.0 },
  { id: 11, x: 84, bot: 24, dur: 2.4, delay: 0.2 },
];

export default function ClawMachineGame({ socket, token, name, setApples }) {
  const [phase,        setPhase]        = useState("idle");
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [reward,       setReward]       = useState(1);
  const [myScore,      setMyScore]      = useState(0);
  const [result,       setResult]       = useState(null);
  const [clawX,        setClawX]        = useState(50);  // 12–88 %
  const [clawY,        setClawY]        = useState(0);   // 0=頂 1=最低
  const [prongsOpen,   setProngsOpen]   = useState(true);
  const [hasCatch,     setHasCatch]     = useState(false);
  const [dropping,     setDropping]     = useState(false);
  const [effects,      setEffects]      = useState([]);
  const [caughtIds,    setCaughtIds]    = useState(new Set()); // 已被夾走的蘋果 id

  // ── refs ──────────────────────────────────────────────────────────────────────
  const phaseRef        = useRef("idle");
  const clawXRef        = useRef(50);
  const dirRef          = useRef(1);
  const speedRef        = useRef(0.5);
  const dropSpeedRef    = useRef(100);  // 50–300，影響下爪動畫時長
  const droppingRef     = useRef(false);
  const myScoreRef      = useRef(0);
  const rewardRef       = useRef(1);
  const timerRef        = useRef(null);
  const oscAnimRef      = useRef(null);
  const dropAnimRef     = useRef(null);
  const catchResultRef  = useRef(null);
  const effectIdRef     = useRef(0);
  const windowRef       = useRef(null);
  // 每顆蘋果的 caught 狀態（給 RAF 讀，不觸發 re-render）
  const appleCaughtRef  = useRef(new Set());

  useEffect(() => { phaseRef.current  = phase;  }, [phase]);
  useEffect(() => { rewardRef.current = reward; }, [reward]);

  // ── 重置蘋果堆 ────────────────────────────────────────────────────────────────
  const resetApples = useCallback(() => {
    appleCaughtRef.current = new Set();
    setCaughtIds(new Set());
  }, []);

  // ── 找最近的未被夾蘋果 ────────────────────────────────────────────────────────
  const findNearestApple = useCallback(() => {
    const cx = clawXRef.current;
    let best = null, bestDist = Infinity;
    for (const a of APPLE_INIT) {
      if (appleCaughtRef.current.has(a.id)) continue;
      const dist = Math.abs(a.x - cx);
      if (dist < bestDist) { bestDist = dist; best = a; }
    }
    return best;
  }, []);

  // ── 搖擺 ──────────────────────────────────────────────────────────────────────
  const stopOscillation = useCallback(() => {
    if (oscAnimRef.current) cancelAnimationFrame(oscAnimRef.current);
  }, []);

  const startOscillation = useCallback(() => {
    const tick = () => {
      if (phaseRef.current !== "playing" || droppingRef.current) return;
      clawXRef.current += dirRef.current * speedRef.current;
      if (clawXRef.current >= 88) { clawXRef.current = 88; dirRef.current = -1; }
      if (clawXRef.current <= 12) { clawXRef.current = 12; dirRef.current =  1; }
      setClawX(clawXRef.current);
      oscAnimRef.current = requestAnimationFrame(tick);
    };
    oscAnimRef.current = requestAnimationFrame(tick);
  }, []);

  // ── 下爪動畫（JS RAF 控制，讓爪子位置和蘋果消失時序精確對齊） ─────────────────
  const runDropAnimation = useCallback(() => {
    const start      = performance.now();
    const windowEl   = windowRef.current;
    const maxExtend  = Math.max(140, (windowEl?.clientHeight ?? 300) - 80);
    if (windowEl) windowEl.style.setProperty("--clw-max-extend", `${maxExtend}px`);

    // 依 dropSpeed 計算本次動畫時長
    const ds      = dropSpeedRef.current;
    const DROP_MS = Math.round(BASE_DROP_MS * 100 / ds);
    const HOLD_MS = Math.max(400, Math.round(BASE_HOLD_MS * 100 / ds));
    const RISE_MS = Math.round(BASE_RISE_MS * 100 / ds);

    let resultApplied = false;

    const tick = (now) => {
      const t = now - start;

      if (t < DROP_MS) {
        // ─── 下降
        setClawY(t / DROP_MS);
        dropAnimRef.current = requestAnimationFrame(tick);

      } else if (t < DROP_MS + HOLD_MS) {
        // ─── 停在底部，等 server 結果
        setClawY(1);

        if (!resultApplied && t > DROP_MS + 230 && catchResultRef.current !== null) {
          resultApplied = true;
          const { success } = catchResultRef.current;
          setProngsOpen(false); // 爪子夾合

          if (success) {
            // 找最近蘋果，讓它消失
            const apple = findNearestApple();
            if (apple) {
              appleCaughtRef.current = new Set([...appleCaughtRef.current, apple.id]);
              setCaughtIds(new Set(appleCaughtRef.current));
            }
            setHasCatch(true); // 爪子上顯示金蘋果
          }
        }
        dropAnimRef.current = requestAnimationFrame(tick);

      } else if (t < DROP_MS + HOLD_MS + RISE_MS) {
        // ─── 上升
        setClawY(1 - (t - DROP_MS - HOLD_MS) / RISE_MS);
        dropAnimRef.current = requestAnimationFrame(tick);

      } else {
        // ─── 完成
        setClawY(0);
        setProngsOpen(true);
        setHasCatch(false);

        const res = catchResultRef.current;
        if (res?.success) {
          const earned = res.earned ?? rewardRef.current;
          myScoreRef.current += earned;
          setMyScore(myScoreRef.current);
          setApples(prev => prev + earned);
          const id = effectIdRef.current++;
          setEffects(prev => [...prev, { id, earned }]);
          setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 1400);
        }

        catchResultRef.current = null;
        droppingRef.current    = false;
        setDropping(false);
        if (phaseRef.current === "playing") startOscillation();
      }
    };

    dropAnimRef.current = requestAnimationFrame(tick);
  }, [setApples, startOscillation, findNearestApple]);

  // ── Socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onStart = ({ duration, reward: r, speed, dropSpeed }) => {
      clearInterval(timerRef.current);
      stopOscillation();
      if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);

      resetApples();
      setPhase("playing");
      phaseRef.current       = "playing";
      setTimeLeft(duration || 30);
      setReward(r || 1);
      rewardRef.current      = r || 1;
      setMyScore(0);
      myScoreRef.current     = 0;
      setResult(null);
      setDropping(false);
      droppingRef.current    = false;
      setClawX(50);
      setClawY(0);
      setProngsOpen(true);
      setHasCatch(false);
      setEffects([]);
      clawXRef.current       = 50;
      dirRef.current         = 1;
      speedRef.current       = speed || 0.5;
      dropSpeedRef.current   = dropSpeed || 100;
      catchResultRef.current = null;

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      startOscillation();
    };

    const onDropResult = ({ success, caught }) => {
      catchResultRef.current = { success, earned: caught ?? rewardRef.current };
    };

    const onEnd = ({ scores }) => {
      clearInterval(timerRef.current);
      stopOscillation();
      if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);

      setPhase("result");
      phaseRef.current    = "result";
      setDropping(false);
      droppingRef.current = false;
      setClawY(0);
      setProngsOpen(true);
      setHasCatch(false);
      setResult(scores);
    };

    socket.on("clawGameStart",  onStart);
    socket.on("clawDropResult", onDropResult);
    socket.on("clawGameEnd",    onEnd);

    return () => {
      socket.off("clawGameStart",  onStart);
      socket.off("clawDropResult", onDropResult);
      socket.off("clawGameEnd",    onEnd);
      clearInterval(timerRef.current);
      stopOscillation();
      if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);
    };
  }, [socket, startOscillation, stopOscillation, resetApples]);

  // ── 玩家按下落爪 ──────────────────────────────────────────────────────────────
  const handleDrop = useCallback(() => {
    if (phaseRef.current !== "playing" || droppingRef.current) return;
    droppingRef.current    = true;
    catchResultRef.current = null;
    setDropping(true);
    stopOscillation();
    socket.emit("clawDropClaw", { token, position: +(clawXRef.current / 100).toFixed(2) });
    runDropAnimation();
  }, [socket, token, stopOscillation, runDropAnimation]);

  // 鍵盤
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); handleDrop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDrop]);

  if (phase === "idle") return null;

  const sortedScores = result ? Object.entries(result).sort(([, a], [, b]) => b - a) : [];
  const ropeH = 20 + clawY * 9999; // CSS var 限制實際最大值

  return (
    <div className="clw-overlay">

      {/* ── HUD ──────────────────────────────────────────────────────────────── */}
      <div className="clw-hud">
        <span className={`clw-timer${timeLeft <= 10 ? " urgent" : timeLeft <= 20 ? " warning" : ""}`}>
          {timeLeft}<span className="clw-timer-unit">秒</span>
        </span>
        <span className="clw-score">
          <img src={APPLE_IMG} className="clw-score-icon" alt="" /> {myScore} 顆
        </span>
        <span className="clw-hint">按「抓！」或空白鍵落下爪子</span>
      </div>

      {/* ── Field ────────────────────────────────────────────────────────────── */}
      <div className="clw-field">
        <div className="clw-machine">

          {/* 標題 */}
          <div className="clw-top-bar">
            <span className="clw-neon-text">🎰 夾蘋果機</span>
          </div>

          {/* 玻璃窗 */}
          <div className="clw-window" ref={windowRef}>

            {/* 軌道 */}
            <div className="clw-rail" />

            {/* 爪子組件 */}
            <div className="clw-claw-system" style={{ left: `${clawX}%` }}>
              <div
                className="clw-rope"
                style={{ height: `min(${ropeH}px, calc(var(--clw-max-extend, 210px) + 20px))` }}
              />
              <div className="clw-claw-head">
                <div className={`clw-prong clw-prong-l${prongsOpen ? "" : " closed"}`} />
                <div className={`clw-prong clw-prong-c${prongsOpen ? "" : " closed"}`} />
                <div className={`clw-prong clw-prong-r${prongsOpen ? "" : " closed"}`} />
                {hasCatch && (
                  <div className="clw-held-apple">
                    <img src={APPLE_IMG} alt="金蘋果" />
                  </div>
                )}
              </div>
            </div>

            {/* 蘋果堆（每顆追蹤位置，夾到後消失） */}
            {APPLE_INIT.map(a => (
              <div
                key={a.id}
                className={`clw-pile-apple${caughtIds.has(a.id) ? " caught" : ""}`}
                style={{
                  left:    `${a.x}%`,
                  bottom:  `${a.bot}%`,
                  "--dur":   `${a.dur}s`,
                  "--delay": `${a.delay}s`,
                }}
              >
                <img src={APPLE_IMG} alt="金蘋果" />
              </div>
            ))}

            {/* 浮動得分特效 */}
            {effects.map(e => (
              <div key={e.id} className="clw-effect">
                +{e.earned} <img src={APPLE_IMG} alt="" />
              </div>
            ))}
          </div>

          {/* 出口 */}
          <div className="clw-slot">
            <span className="clw-slot-label">出口</span>
          </div>
        </div>

        {/* 抓！按鈕 */}
        <button
          className={`clw-grab-btn${dropping ? " disabled" : ""}`}
          onClick={handleDrop}
          disabled={dropping || phase !== "playing"}
        >
          {dropping ? "⋯" : "抓！"}
        </button>
      </div>

      {/* ── 結果 ─────────────────────────────────────────────────────────────── */}
      {phase === "result" && result && (
        <div className="clw-result" onClick={() => { setPhase("idle"); phaseRef.current = "idle"; }}>
          <h2>🎉 遊戲結束</h2>
          <p className="clw-my-rank">
            你夾了 <strong>{myScore}</strong> 顆金蘋果
          </p>
          <ul>
            {sortedScores.map(([n, s], i) => (
              <li key={n} className={n === name ? "me" : ""}>
                {i + 1}. {n}：{s} 顆
              </li>
            ))}
          </ul>
          <div className="clw-dismiss-hint">點擊關閉</div>
        </div>
      )}
    </div>
  );
}
