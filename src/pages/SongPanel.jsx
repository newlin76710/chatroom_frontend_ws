import { useEffect, useRef, useState } from "react";
import "./SongPanel.css";

export default function SongPanel({ socket, room, name }) {
  const localStreamRef = useRef(null);
  const sendPCRef = useRef(null); // 自己的發送連線
  const receivePCsRef = useRef({}); // 接收其他人音訊
  const [recording, setRecording] = useState(false);
  const [canSing, setCanSing] = useState(true);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [scoreSent, setScoreSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // ----- 開始唱歌 -----
  const startRecord = async () => {
    if (!canSing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      sendPCRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-candidate", { room, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { room, offer });

      setRecording(true);
      setCanSing(false);
      socket.emit("start-singing", { room, singer: name });
    } catch (err) {
      console.error("取得麥克風失敗", err);
      alert("無法取得麥克風權限");
    }
  };

  // ----- 結束唱歌 -----
  const stopRecord = () => {
    if (sendPCRef.current) {
      sendPCRef.current.close();
      sendPCRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    setRecording(false);
    socket.emit("stop-singing", { room, singer: name });
    startScoreCountdown();
  };

  // ----- 評分倒數 15 秒 -----
  const startScoreCountdown = () => {
    setTimeLeft(15);
    setScoreSent(false);
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const sendScore = (n) => {
    if (scoreSent) return;
    setScore(n);
    setScoreSent(true);
    setHoverScore(0);
    socket.emit("scoreSong", { room, score: n });
    setTimeLeft(0);
    setCanSing(true); // 下一位可唱歌
  };

  // ----- WebRTC 接收其他人音訊 -----
  useEffect(() => {
    // 接收 offer
    socket.on("webrtc-offer", async ({ offer, sender }) => {
      if (sender === name) return; // 自己的不要處理
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });

      pc.ontrack = (event) => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.volume = muted ? 0 : volume;
        audio.id = `audio-${sender}`;
        document.body.appendChild(audio);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-candidate", { room, candidate: event.candidate, to: sender });
        }
      };

      receivePCsRef.current[sender] = pc;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { room, answer, to: sender });
    });

    // 接收 answer
    socket.on("webrtc-answer", async ({ answer }) => {
      await sendPCRef.current?.setRemoteDescription(answer);
    });

    // 接收 candidate
    socket.on("webrtc-candidate", async ({ candidate, to }) => {
      try {
        if (to && to === name) return;
        if (to) {
          await receivePCsRef.current[to]?.addIceCandidate(candidate);
        } else {
          await sendPCRef.current?.addIceCandidate(candidate);
        }
      } catch (err) {
        console.warn("Add ICE candidate failed:", err);
      }
    });

    // 房間唱歌狀態
    socket.on("user-start-singing", () => setCanSing(false));
    socket.on("user-stop-singing", () => setCanSing(true));

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-candidate");
      socket.off("user-start-singing");
      socket.off("user-stop-singing");
    };
  }, [socket, muted, volume]);

  return (
    <div className="song-panel">
      <h4>🎤 唱歌區</h4>

      <div className="controls">
        {!recording ? (
          <button disabled={!canSing} onClick={startRecord}>
            開始唱歌
          </button>
        ) : (
          <button onClick={stopRecord}>結束唱歌</button>
        )}
      </div>

      {timeLeft > 0 && (
        <div className="score-section">
          ⏱️ 評分倒數：<span>{timeLeft} 秒</span>
          <div className="score-stars">
            {[1,2,3,4,5].map(n => (
              <span
                key={n}
                className={`star ${n <= (hoverScore || score) ? "active" : ""}`}
                onMouseEnter={() => !scoreSent && setHoverScore(n)}
                onMouseLeave={() => !scoreSent && setHoverScore(0)}
                onClick={() => !scoreSent && sendScore(n)}
              >★</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
