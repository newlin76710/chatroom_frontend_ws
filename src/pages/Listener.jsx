// Listener.jsx
import { useEffect, useRef } from "react";

export default function Listener({ socket, room }) {
  const audioRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "8377acb6c166cbf568e9e013",
          credential: "v+uDnYMJ5YIejFhv",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "8377acb6c166cbf568e9e013",
          credential: "v+uDnYMJ5YIejFhv",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "8377acb6c166cbf568e9e013",
          credential: "v+uDnYMJ5YIejFhv",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "8377acb6c166cbf568e9e013",
          credential: "v+uDnYMJ5YIejFhv",
        },
      ],
    });

    pcRef.current = pc;

    pc.ontrack = e => {
      console.log("🎧 ontrack");
      audioRef.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("webrtc-ice", { room, candidate: e.candidate });
      }
    };

    socket.on("webrtc-offer", async ({ offer }) => {
      console.log("📩 offer received");
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { room, answer });
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      await pc.addIceCandidate(candidate);
    });

    return () => {
      pc.close();
      socket.off("webrtc-offer");
      socket.off("webrtc-ice");
    };
  }, [socket, room]);

  // 🔑 autoplay 解鎖（超重要）
  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      <button
        onClick={() => {
          audioRef.current.muted = false;
          audioRef.current.play();
        }}
      >
        🔊 開始收聽
      </button>
      <button
        onClick={() => {
          audioRef.current.pause();
        }}
      >
        ⏹️ 停止收聽
      </button>
    </>
  );
}
