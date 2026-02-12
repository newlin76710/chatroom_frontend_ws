import { useState, useEffect, useRef } from "react";
import { Room, LocalAudioTrack } from "livekit-client";

export default function SongRoom({ room, name, socket, currentSinger }) {
  const [lkRoom, setLkRoom] = useState(null);
  const [singing, setSinging] = useState(false);
  const [sharing, setSharing] = useState(false);

  const roomRef = useRef(null);

  // 保存 MediaStream（關鍵）
  const micStreamRef = useRef(null);
  const displayStreamRef = useRef(null);

  // 保存 LiveKit tracks
  const micTrackRef = useRef(null);
  const tabTrackRef = useRef(null);

  /////////////////////////////////////////////
  // 🔥 強制停止（給 server call）
  /////////////////////////////////////////////

  useEffect(() => {
    if (!socket) return;

    const forceStop = () => stopSing();

    socket.on("forceStopSing", forceStop);

    return () => {
      socket.off("forceStopSing", forceStop);
    };
  }, [socket]);

  /////////////////////////////////////////////
  // 🔥 React unmount 防漏音（超重要）
  /////////////////////////////////////////////

  useEffect(() => {
    return () => {
      stopSing(true);
    };
  }, []);

  /////////////////////////////////////////////
  // 🎤 上麥
  /////////////////////////////////////////////

  const startSing = async (jwtToken) => {
    try {
      const lk = new Room();

      await lk.connect(import.meta.env.VITE_LIVEKIT_URL, jwtToken);

      roomRef.current = lk;
      setLkRoom(lk);

      //////////////////////////////////////
      // LiveKit 防斷線殘音
      //////////////////////////////////////

      lk.on("disconnected", () => {
        console.log("[LiveKit] disconnected -> stopSing()");
        stopSing(true);
      });

      //////////////////////////////////////
      // 麥克風
      //////////////////////////////////////

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      micStreamRef.current = micStream;

      const micTrack = new LocalAudioTrack(micStream.getAudioTracks()[0]);
      micTrackRef.current = micTrack;

      await lk.localParticipant.publishTrack(micTrack);

      setSinging(true);

      console.log("[SongRoom] 已上麥 🎤");
    } catch (err) {
      console.error("[SongRoom] startSing failed:", err);
    }
  };

  /////////////////////////////////////////////
  // 🛑 下麥（企業級寫法）
  /////////////////////////////////////////////

  const stopSing = async (silent = false) => {
    try {
      const lk = roomRef.current;

      //////////////////////////////////////
      // 1️⃣ 先 unpublish（最重要）
      //////////////////////////////////////

      if (lk) {
        const tracks = lk.localParticipant.getTracks();

        for (const pub of tracks) {
          await lk.localParticipant.unpublishTrack(pub.track);
          pub.track?.stop();
        }
      }

      //////////////////////////////////////
      // 2️⃣ stop MediaStream（真正關閉硬體）
      //////////////////////////////////////

      micStreamRef.current?.getTracks().forEach(t => t.stop());
      displayStreamRef.current?.getTracks().forEach(t => t.stop());

      micStreamRef.current = null;
      displayStreamRef.current = null;

      //////////////////////////////////////
      // 3️⃣ disconnect room
      //////////////////////////////////////

      await lk?.disconnect();

      roomRef.current = null;
      setLkRoom(null);

      micTrackRef.current = null;
      tabTrackRef.current = null;

      setSinging(false);
      setSharing(false);

      if (!silent) {
        socket.emit("stopSing", { room, singer: name });
      }

      console.log("[SongRoom] ✅ 已完全下麥（無殘音）");

    } catch (err) {
      console.error("stopSing error:", err);
    }
  };

  /////////////////////////////////////////////
  // 📢 分頁音（獨立 track，不混音）
  /////////////////////////////////////////////

  const shareTabAudio = async () => {
    if (!roomRef.current) return;

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioTrack = displayStream.getAudioTracks()[0];

      if (!audioTrack) {
        console.log("沒有抓到分頁音");
        return;
      }

      displayStreamRef.current = displayStream;

      const tabTrack = new LocalAudioTrack(audioTrack);
      tabTrackRef.current = tabTrack;

      await roomRef.current.localParticipant.publishTrack(tabTrack);

      setSharing(true);

      console.log("[SongRoom] 分頁音已加入 🎶");

      //////////////////////////////////////
      // 使用者按「停止分享」
      //////////////////////////////////////

      audioTrack.onended = () => {
        console.log("[SongRoom] 使用者停止分享");
        tabTrack.stop();
        roomRef.current?.localParticipant.unpublishTrack(tabTrack);
        setSharing(false);
      };

    } catch (err) {
      console.error("[SongRoom] shareTabAudio failed:", err);
    }
  };

  /////////////////////////////////////////////

  const grabMic = () => {
    socket.emit("grabMic", { room, singer: name });

    socket.once("livekit-token", ({ token }) => {
      startSing(token);
    });
  };

  const otherSinger = currentSinger && currentSinger !== name;
  const grabDisabled = !singing && otherSinger;
  const grabTitle = grabDisabled ? "請等歌手下 Mic" : "";

  /////////////////////////////////////////////

  return (
    <div style={{ padding: 12 }}>
      <button
        onClick={singing ? stopSing : grabMic}
        disabled={grabDisabled}
        title={grabTitle}
        style={{
          opacity: grabDisabled ? 0.5 : 1,
          cursor: grabDisabled ? "not-allowed" : "pointer",
          marginRight: 8
        }}
      >
        {singing ? "🛑 下麥" : "🎤 上麥"}
      </button>

      {/* <button
        onClick={shareTabAudio}
        disabled={!singing || sharing}
        style={{
          opacity: !singing || sharing ? 0.5 : 1,
          cursor: !singing || sharing ? "not-allowed" : "pointer",
        }}
      >
        {sharing ? "✅ 已分享分頁音" : "📢 分享分頁音"}
      </button> */}
    </div>
  );
}
