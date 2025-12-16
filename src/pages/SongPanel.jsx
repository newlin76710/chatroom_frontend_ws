import { useEffect, useRef, useState } from "react";

export default function SongPanel({ socket, room, name, uploadSong }) {
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const [recording, setRecording] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [score, setScore] = useState(0);
  const audioRef = useRef(null);

  // 🎤 開始錄音
  const startRecord = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunks.current = [];

    recorder.ondataavailable = e => audioChunks.current.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      if (uploadSong) await uploadSong(blob);
    };

    recorder.start();
    setRecording(true);
  };

  // ⏹ 停止錄音
  const stopRecord = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // 🔊 監聽播放歌曲
  useEffect(() => {
    socket.on("playSong", song => {
      setCurrentSong(song);
      setScore(0);
    });

    socket.on("songResult", ({ singer, avg, count }) => {
      alert(`🎤 ${singer} 平均分數：${avg}（${count} 人評分）`);
      setCurrentSong(null);
      setScore(0);
    });

    return () => {
      socket.off("playSong");
      socket.off("songResult");
    };
  }, [socket]);

  // ⭐ 送出評分
  const sendScore = () => {
    if (!currentSong) return;
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

      {currentSong && (
        <div className="song-playing">
          <p>🎶 正在播放：{currentSong.singer}</p>
          <audio ref={audioRef} src={currentSong.url} controls autoPlay />

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
