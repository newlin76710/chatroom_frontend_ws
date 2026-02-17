// SongRoom.jsx
import { useState, useEffect, useRef } from "react";
import { Room, LocalAudioTrack } from "livekit-client";

export default function SongRoom({ room, name, socket, currentSinger }) {
  const [lkRoom, setLkRoom] = useState(null);
  const [singing, setSinging] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [myPosition, setMyPosition] = useState(0);
  const [queue, setQueue] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const roomRef = useRef(null);
  const audioCtxRef = useRef(null);
  const destRef = useRef(null);

  // 保存 track / source
  const micTrackRef = useRef(null);
  const micSourceRef = useRef(null);
  const micStreamRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("forceStopSing", () => {
      stopSing();
    });

    // ⭐ 後端通知輪到你
    socket.on("yourTurn", () => {
      console.log("[SongRoom] 輪到我上麥 🎯");
      setWaiting(false);
      grabMic();
    });
    socket.on("micStateUpdate", (data) => {
      setQueue(data.queue);
      const index = data.queue.indexOf(name);
      setMyPosition(index + 1); // 排第幾個
    });
    return () => {
      socket.off("forceStopSing");
      socket.off("yourTurn");
      socket.off("micStateUpdate");
    };
  }, [socket, name]);

  const startSing = async (jwtToken) => {
    try {
      const lk = new Room();
      roomRef.current = lk;
      await lk.connect(import.meta.env.VITE_LIVEKIT_URL, jwtToken);

      // 建立 AudioContext
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      destRef.current = dest;

      // 麥克風
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });

      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(dest);
      micSourceRef.current = micSource;
      micStreamRef.current = micStream;

      const micTrack = new LocalAudioTrack(dest.stream.getAudioTracks()[0]);
      micTrackRef.current = micTrack;
      await lk.localParticipant.publishTrack(micTrack);

      setLkRoom(lk);
      setSinging(true);
      console.log("[SongRoom] 已上麥 🎤");
    } catch (err) {
      console.error("[SongRoom] startSing failed:", err);
    }
  };

  const stopSing = async () => {
    // 停止 mic track
    // ⭐⭐⭐ 先讓 LiveKit 停止送音
    const lk = roomRef.current;
    await lk?.localParticipant.setMicrophoneEnabled(false);

    // 再 unpublish
    if (micTrackRef.current) {
      await lk?.localParticipant.unpublishTrack(micTrackRef.current);
    }

    // 再砍 pipeline
    micSourceRef.current?.disconnect();
    micSourceRef.current = null;
    // 再停裝置
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
    micTrackRef.current?.mediaStreamTrack?.stop(); // 🔥 真正關閉裝置
    micTrackRef.current?.stop();
    micTrackRef.current = null;

    // 最後斷房
    await lk?.disconnect();
    roomRef.current = null;
    setLkRoom(null);

    await audioCtxRef.current?.suspend();
    await audioCtxRef.current?.close();
    audioCtxRef.current = null;
    destRef.current = null;

    setSinging(false);

    socket.emit("stopSing", { room, singer: name });
    console.log("[SongRoom] 已下麥 🛑");
  };

  const grabMic = () => {
    socket.emit("grabMic", { room, singer: name });
    socket.once("livekit-token", ({ token }) => {
      startSing(token);
    });
  };
  const joinQueue = () => {
    socket.emit("joinQueue", { room, name });
    setWaiting(true);
  };
  const leaveQueue = () => {
    socket.emit("leaveQueue", { room, name });
    setWaiting(false);   // 前端狀態同步
  };

  const otherSinger = currentSinger && currentSinger !== name;
  const grabDisabled = !singing && otherSinger;
  const grabTitle = grabDisabled ? "請等歌手下 Mic" : "";

  return (
    <div style={{ padding: 12 }}>
      <button
        onClick={singing ? stopSing : waiting? leaveQueue : otherSinger ? joinQueue : grabMic}
        disabled={waiting}
        style={{
          opacity: waiting ? 0.5 : 1,
          cursor: waiting ? "not-allowed" : "pointer",
          marginRight: 8
        }}
      >
        {singing
          ? "🛑 下麥"
          : waiting
            ? `⏳ 取消排隊`
            : otherSinger
              ? "🎶 排麥"
              : "🎤 上麥"}
      </button>
      {/* ===== 排麥小窗 ===== */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 330,
          width: 200,
          background: "#1e1e1e",
          color: "white",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          overflow: "hidden",
          fontSize: 14,
          zIndex: 999
        }}
      >
        {/* Header */}
        <div
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            padding: "8px 12px",
            background: "#333",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>🎤 麥序列表</span>
          <span>{panelOpen ? "−" : "+"}</span>
        </div>

        {/* Content */}
        {panelOpen && (
          <div style={{ padding: 10 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>正在唱：</strong>
              <div style={{ color: "#4ade80" }}>
                {currentSinger || "無"}
              </div>
            </div>

            <div>
              <strong>排隊中：</strong>
              {queue.length === 0 ? (
                <div style={{ opacity: 0.6 }}>目前沒有人排麥</div>
              ) : (
                queue.map((q, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "4px 6px",
                      borderRadius: 6,
                      marginTop: 4,
                      background:
                        q === name ? "rgba(74,222,128,0.2)" : "transparent",
                      fontWeight: q === name ? "bold" : "normal"
                    }}
                  >
                    {index + 1}. {q}
                    {q === name && " (我)"}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
