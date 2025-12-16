import { useEffect, useRef, useState } from "react";

export default function SongPanel({ socket, room, name, uploadSong }) {
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const [recording, setRecording] = useState(false);
  const [playingSong, setPlayingSong] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // 剩餘評分時間
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // 🎤 開始錄音
  const startRecord = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunks.current = [];

    recorder.ondataavailable = e => audioChunks.current.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      if (uploadSong) {
        await uploadSong(blob);
      }
    };

    recorder.start();
    setRecording(true);
  };

  // ⏹ 停止錄音
  const stopRecord = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // 🔊 播放房間內的歌
  useEffect(() => {
    socket.on("playSong", ({ singer, songUrl }) => {
      if (!singer) {
        setPlayingSong(null);
        setTimeLeft(0);
        return;
      }

      setPlayingSong({ singer, songUrl });
      setScore(0);

      // ⭐ 設定倒數 1.5 分鐘
      setTimeLeft(90);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on("songResult", ({ singer, avg, count }) => {
      alert(`🎤 ${singer} 平均分數：${avg}（${count}人評分）`);
      setPlayingSong(null);
      setScore(0);
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      socket.off("playSong");
      socket.off("songResult");
    };
  }, [socket]);

  // ⭐ 送出評分
  const sendScore = () => {
    socket.emit("scoreSong", { room, score });
  };

  return (
    <div className="song-panel">
      <h4>🎤 唱歌區</h4>

      {!recording ? (
        <button onClick={startRecord}>開始唱歌</button>
      ) : (
        <button onClick={stopRecord}>結束錄音</button>
      )}

      {playingSong && (
        <div className="song-playing">
          <p>🎶 正在播放：{playingSong.singer}</p>
          <audio ref={audioRef} src={playingSong.songUrl} controls autoPlay />

          {/* 倒數計時 */}
          <p>⏱ 剩餘評分時間：{timeLeft}s</p>

          <div className="score">
            <select value={score} onChange={e => setScore(+e.target.value)}>
              <option value="0">評分</option>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} ⭐</option>
              ))}
            </select>
            <button onClick={sendScore}>送出</button>
          </div>
        </div>
      )}
    </div>
  );
}
