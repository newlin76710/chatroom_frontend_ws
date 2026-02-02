import { useState, useEffect, useRef } from "react";
import { Room } from "livekit-client";
import "./Listener.css";

export default function Listener({ room, name, socket, onSingerChange }) {
  const [lkRoom, setLkRoom] = useState(null);
  const [listening, setListening] = useState(false);
  const [currentSinger, setCurrentSinger] = useState(null);

  // identity -> audio element
  const audioElementsRef = useRef({});
  // identity -> audio track
  const audioTracksRef = useRef({});

  /* ===== Socket：目前演唱者 ===== */
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      console.log("[Listener] micStateUpdate:", data);
      const singer = data.currentSinger || null;
      setCurrentSinger(singer);
      onSingerChange?.(singer);
    };

    socket.on("micStateUpdate", handler);
    return () => socket.off("micStateUpdate", handler);
  }, [socket]);

  /* ===== 清掉所有 audio element（核心工具） ===== */
  const clearAllAudio = () => {
    Object.values(audioElementsRef.current).forEach((el) => {
      el.pause?.();
      el.remove();
    });
    audioElementsRef.current = {};
  };

  /* ===== 嘗試 attach 目前演唱者 ===== */
  const tryAttachSingerTrack = (identity) => {
    if (!currentSinger) return;
    if (identity !== currentSinger) return;

    const track = audioTracksRef.current[identity];
    if (!track) return;

    // ⭐ 保證只剩一條 audio
    clearAllAudio();

    const audioEl = track.attach();
    audioEl.autoplay = true;
    audioEl.volume = 1;

    document.body.appendChild(audioEl);
    audioEl.play?.().catch(() => {});

    audioElementsRef.current[identity] = audioEl;

    console.log("[Listener] now listening:", identity);
  };

  /* ===== singer 換人時，一定重新 attach ===== */
  useEffect(() => {
    if (!lkRoom || !currentSinger) return;

    clearAllAudio();
    tryAttachSingerTrack(currentSinger);
  }, [currentSinger, lkRoom]);

  /* ===== 停止收聽 ===== */
  const stopListening = () => {
    console.log("[Listener] stopping");

    if (lkRoom) {
      lkRoom.removeAllListeners();
      lkRoom.disconnect();
    }

    clearAllAudio();
    audioTracksRef.current = {};

    setLkRoom(null);
    setListening(false);
  };

  /* ===== 開始 / 停止 ===== */
  const toggleListening = async () => {
    if (!name) return;

    if (listening) {
      stopListening();
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/livekit-token?room=${room}&name=${name}`
      );
      const data = await res.json();
      if (!data.token) return;

      const lk = new Room();

      lk.on("trackSubscribed", (track, publication, participant) => {
        if (track.kind !== "audio") return;

        audioTracksRef.current[participant.identity] = track;
        tryAttachSingerTrack(participant.identity);
      });

      lk.on("trackUnsubscribed", (track, publication, participant) => {
        delete audioTracksRef.current[participant.identity];

        const el = audioElementsRef.current[participant.identity];
        if (el) {
          el.pause?.();
          el.remove();
          delete audioElementsRef.current[participant.identity];
        }
      });

      await lk.connect(import.meta.env.VITE_LIVEKIT_URL, data.token, {
        autoSubscribe: true,
      });

      setLkRoom(lk);
      setListening(true);

      console.log("[Listener] listening started");
    } catch (err) {
      console.error("[Listener] failed:", err);
      stopListening();
    }
  };

  return (
    <div className="listener-bar">
      <span className="current-singer">
        🎤 目前演唱者：{currentSinger || "無人唱歌"}
      </span>

      <button className="listen-btn" onClick={toggleListening}>
        {listening ? "🛑 停止收聽" : "🎧 開始收聽"}
      </button>
    </div>
  );
}
