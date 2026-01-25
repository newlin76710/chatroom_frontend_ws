import { useState, useEffect, useRef } from "react";
import { Room, LocalAudioTrack } from "livekit-client";

export default function SongRoom({ room, name, socket }) {
  const [lkRoom, setLkRoom] = useState(null);
  const [singing, setSinging] = useState(false);

  const roomRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // 被踢掉
    socket.on("forceStopSing", () => {
      stopSing();
    });

    return () => {
      socket.off("forceStopSing");
    };
  }, [socket]);

  const startSing = async (jwtToken) => {
    try {
      // 1️⃣ 建立 LiveKit Room
      const lk = new Room();
      roomRef.current = lk;
      await lk.connect(import.meta.env.VITE_LIVEKIT_URL, jwtToken);

      // 2️⃣ AudioContext 混音
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      // 3️⃣ 麥克風
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      audioCtx.createMediaStreamSource(micStream).connect(dest);

      // 4️⃣ 分享任意分頁音訊（使用者選擇）
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const tabAudioTrack = displayStream.getAudioTracks()[0];
      if (tabAudioTrack) {
        audioCtx.createMediaStreamSource(new MediaStream([tabAudioTrack])).connect(dest);
      }

      // 5️⃣ 使用 LocalAudioTrack 發送混音
      const mixedTrack = new LocalAudioTrack(dest.stream.getAudioTracks()[0]);
      await lk.localParticipant.publishTrack(mixedTrack);

      setLkRoom(lk);
      setSinging(true);
      console.log("[SongRoom] 開始唱歌（分頁混音）🎤");
    } catch (err) {
      console.error("[SongRoom] startSing failed:", err);
    }
  };

  const stopSing = () => {
    lkRoom?.localParticipant.unpublishTracks();
    lkRoom?.disconnect();
    audioCtxRef.current?.close();

    setLkRoom(null);
    setSinging(false);
    socket.emit("stopSing", { room, singer: name });
  };

  const grabMic = () => {
    socket.emit("grabMic", { room, singer: name });

    // 從後端獲得 token 後開始
    socket.once("livekit-token", ({ token }) => {
      startSing(token);
    });
  };

  return (
    <div style={{ padding: 12 }}>
      {singing ? (
        <button onClick={stopSing}>🛑 停止唱</button>
      ) : (
        <button onClick={grabMic}>🎤 搶 Mic</button>
      )}
    </div>
  );
}
