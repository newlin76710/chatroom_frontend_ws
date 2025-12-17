import { useEffect, useRef, useState } from "react";
import "./SongPanel.css";

export default function SongPanel({ socket, room, name, uploadSong }) {
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [playingSong, setPlayingSong] = useState(null);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [scoreSent, setScoreSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [displayQueue, setDisplayQueue] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // 🎤 開始錄音
  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        if (typeof uploadSong === "function") {
          await uploadSong(blob);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("錄音失敗", err);
    }
  };

  // ⏹ 停止錄音
  const stopRecord = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  // ⭐ 送出評分
  const sendScore = (n) => {
    if (scoreSent || !socket) return;

    setScore(n);
    setScoreSent(true);
    setHoverScore(0);
    setTimeLeft(0);

    socket.emit?.("scoreSong", { room, score: n });
  };

  // ⏱ 倒數
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  // 🔊 Socket 事件
  useEffect(() => {
    if (!socket) return;

    const onPlaySong = (song) => {
      if (!song) {
        resetState();
        return;
      }
      setPlayingSong({ singer: song.singer, songUrl: song.url });
      resetScore();
    };

    const onSongResult = ({ singer, avg, count }) => {
      alert(`🎤 ${singer} 平均分數：${avg}（${count}人評分）`);
      resetState();
    };

    socket.on("playSong", onPlaySong);
    socket.on("songResult", onSongResult);
    socket.on("displayQueueUpdate", (q) => setDisplayQueue(q || []));

    return () => {
      socket.off("playSong", onPlaySong);
      socket.off("songResult", onSongResult);
      socket.off("displayQueueUpdate");
    };
  }, [socket]);

  const resetScore = () => {
    setScore(0);
    setHoverScore(0);
    setScoreSent(false);
    setTimeLeft(0);
  };

  const resetState = () => {
    setPlayingSong(null);
    resetScore();
  };

  useEffect(() => {
    if (timeLeft === 0 && playingSong && score > 0 && !scoreSent) {
      sendScore(score);
    }
  }, [timeLeft]);

  return (
    <div className={`song-panel floating ${collapsed ? "collapsed" : ""}`}>
      <div className="song-header" onClick={() => setCollapsed(!collapsed)}>
        <h4>🎤 唱歌區</h4>
        <button type="button">{collapsed ? "▲ 展開" : "▼ 收起"}</button>
      </div>

      {!collapsed && (
        <>
          {!recording ? (
            <button onClick={startRecord}>開始唱歌</button>
          ) : (
            <button onClick={stopRecord}>結束錄音</button>
          )}

          {playingSong && (
            <div className="song-playing">
              <p>🎶 正在播放：{playingSong.singer}</p>
              <audio
                ref={audioRef}
                src={playingSong.songUrl}
                controls
                autoPlay
                onEnded={() => setTimeLeft(30)}
              />

              <div className="score">
                {[1,2,3,4,5].map((n) => (
                  <span
                    key={n}
                    className={`star ${n <= (hoverScore || score) ? "active" : ""}`}
                    onMouseEnter={() => !scoreSent && setHoverScore(n)}
                    onMouseLeave={() => !scoreSent && setHoverScore(0)}
                    onClick={() => !scoreSent && sendScore(n)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
