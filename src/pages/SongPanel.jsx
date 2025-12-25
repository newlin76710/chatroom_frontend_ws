// SongPanel.jsx
import { useRef, useState } from "react";

export default function SongPanel({ socket, room, name }) {
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const [singing, setSinging] = useState(false);

  async function startSing() {
    if (singing) return;

    console.log("🎤 startSing");

    // 1. 麥克風
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // 2. PeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    pcRef.current = pc;

    // 3. 加音軌
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // 4. ICE
    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("webrtc-ice", { room, candidate: e.candidate });
      }
    };

    // 5. Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      room,
      offer,
      singer: name,
    });

    setSinging(true);
  }

  function stopSing() {
    console.log("🛑 stopSing");

    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();

    streamRef.current = null;
    pcRef.current = null;
    setSinging(false);

    socket.emit("webrtc-stop", { room });
  }

  // 6. 接收 answer
  socket.off("webrtc-answer").on("webrtc-answer", async ({ answer }) => {
    await pcRef.current?.setRemoteDescription(answer);
  });

  socket.off("webrtc-ice").on("webrtc-ice", async ({ candidate }) => {
    await pcRef.current?.addIceCandidate(candidate);
  });

  return (
    <div>
      {!singing ? (
        <button onClick={startSing}>開始唱</button>
      ) : (
        <button onClick={stopSing}>停止</button>
      )}
    </div>
  );
}
