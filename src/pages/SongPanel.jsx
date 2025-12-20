import { useEffect, useRef, useState } from "react";
import "./SongPanel.css";

export default function SongPanel({ socket, room, name }) {
  const pcsRef = useRef({}); // 每個 peer 一個 PC
  const localStreamRef = useRef(null);
  const audioRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [currentSinger, setCurrentSinger] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isListener, setIsListener] = useState(false);

  // 評分
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [scoreSent, setScoreSent] = useState(false);
  const timerRef = useRef(null);

  // 麥克風音量
  const [micLevel, setMicLevel] = useState(0);

  /* ==========================
     WebRTC：確保 PC
  ========================== */
  const ensurePC = (peerName) => {
    if (pcsRef.current[peerName]) return pcsRef.current[peerName];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ]
    });

    pc.ontrack = (e) => {
      audioRef.current.srcObject = e.streams[0];
      audioRef.current.play().catch(() => {});
      setIsListener(true);
      socket.emit("listener-ready", { room });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-candidate", { candidate: e.candidate, to: peerName });
      }
    };

    pcsRef.current[peerName] = pc;
    return pc;
  };

  /* ==========================
     排隊 & 開唱
  ========================== */
  const joinQueue = () => {
    socket.emit("join-queue", { room, name });
  };

  const startSinging = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    // 發送 track 給所有 listener
    const listeners = queue.filter(n => n !== name);
    listeners.forEach(async listener => {
      const pc = ensurePC(listener);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { offer, to: listener });
    });

    // Mic 音量
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setMicLevel(avg);
      if (recording) requestAnimationFrame(tick);
    };
    setRecording(true);
    tick();
  };

  const stopSinging = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setRecording(false);
    setMicLevel(0);
    socket.emit("stop-singing", { room });

    setTimeLeft(15);
    setScoreSent(false);
  };

  /* ==========================
     評分倒數
  ========================== */
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const sendScore = (n) => {
    if (scoreSent) return;
    setScore(n);
    setScoreSent(true);
    socket.emit("scoreSong", { room, score: n });
  };

  /* ==========================
     Socket 事件
  ========================== */
  useEffect(() => {
    socket.on("queue-update", ({ queue }) => setQueue(queue));

    socket.on("start-singer", ({ singer }) => {
      setCurrentSinger(singer);
      setIsListener(false);
      setTimeLeft(0);
      setScore(0);
      setScoreSent(false);

      if (singer === name) startSinging();
    });

    socket.on("stop-singer", () => {
      setCurrentSinger(null);
      setRecording(false);
      setMicLevel(0);
    });

    socket.on("webrtc-offer", async ({ offer, sender }) => {
      const pc = ensurePC(sender);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { answer, to: sender });
    });

    socket.on("webrtc-answer", async ({ answer, sender }) => {
      const pc = pcsRef.current[sender];
      if (pc) await pc.setRemoteDescription(answer);
    });

    socket.on("webrtc-candidate", async ({ candidate, sender }) => {
      const pc = pcsRef.current[sender];
      if (pc) await pc.addIceCandidate(candidate);
    });

    socket.on("songResult", ({ singer, avg }) => {
      alert(`🎤 ${singer} 平均分：${avg}`);
    });

    return () => socket.off();
  }, [queue, recording]);

  /* ==========================
     UI
  ========================== */
  return (
    <div className="song-panel">
      <h4>🎤 唱歌區</h4>

      <div className="now-singing">
        {currentSinger ? `🎶 現在演唱：${currentSinger}` : "尚未開始"}
      </div>

      {recording && (
        <div className="mic-meter">
          <div className="mic-bar" style={{ width: `${Math.min(micLevel, 100)}%` }} />
        </div>
      )}

      {!currentSinger && (
        <button onClick={joinQueue} disabled={currentSinger === name}>
          {queue.includes(name) ? "已在排隊中" : "加入唱歌排隊"}
        </button>
      )}

      {currentSinger === name && recording && (
        <button onClick={stopSinging}>結束演唱</button>
      )}

      {queue.length > 0 && <div className="queue">⏳ 排隊中：{queue.join(" → ")}</div>}

      <audio ref={audioRef} autoPlay playsInline controls={false} />

      {timeLeft > 0 && (
        <>
          {currentSinger === name && (
            <div className="score-section disabled">🚫 你不能幫自己評分</div>
          )}
          {currentSinger !== name && !isListener && (
            <div className="score-section disabled">🔇 尚未接收到聲音，無法評分</div>
          )}
          {currentSinger !== name && isListener && (
            <div className="score-section">
              ⏱️ 評分倒數：<span>{timeLeft} 秒</span>
              {!scoreSent ? (
                <div className="score-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`star ${n <= (hoverScore || score) ? "active" : ""}`}
                      onMouseEnter={() => setHoverScore(n)}
                      onMouseLeave={() => setHoverScore(0)}
                      onClick={() => sendScore(n)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              ) : (
                <div className="your-score">你給了：{score} 分</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
