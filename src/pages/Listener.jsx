// Listener.jsx（增加離開清理）
import { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

export default function Listener({ socket, room }) {
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const audioRef = useRef(null);
  const consumedRef = useRef(new Set());
  const pendingProducersRef = useRef([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const log = (...args) => console.log("🔹 Listener log:", ...args);

  const tryPlayAudio = async () => {
    if (audioRef.current && audioRef.current.srcObject) {
      try { await audioRef.current.play(); log("🎧 audio playing"); } 
      catch (e) { log("❌ play blocked", e); }
    }
  };

  const consumeProducer = async (producerId) => {
    if (consumedRef.current.has(producerId)) return;
    consumedRef.current.add(producerId);

    if (!deviceRef.current || !recvTransportRef.current || recvTransportRef.current.connectionState !== "connected") {
      pendingProducersRef.current.push(producerId);
      return;
    }

    const { id, kind, rtpParameters } = await new Promise(resolve => {
      socket.emit("consume", { producerId, rtpCapabilities: deviceRef.current.rtpCapabilities }, resolve);
    });

    const consumer = await recvTransportRef.current.consume({ id, producerId, kind, rtpParameters, paused: false });
    if (!audioRef.current.srcObject) audioRef.current.srcObject = new MediaStream();
    audioRef.current.srcObject.addTrack(consumer.track);
    audioRef.current.muted = false;
    audioRef.current.volume = 1.0;
    if (audioUnlocked) tryPlayAudio();
  };

  const unlockAudio = async () => {
    setAudioUnlocked(true);
    if (!audioRef.current.srcObject) audioRef.current.srcObject = new MediaStream();
    tryPlayAudio();
    for (const pid of pendingProducersRef.current) await consumeProducer(pid);
    pendingProducersRef.current = [];
  };

  useEffect(() => {
    const init = async () => {
      const device = new mediasoupClient.Device();
      deviceRef.current = device;
      const { rtpCapabilities } = await fetch(`${BACKEND}/mediasoup-rtpCapabilities`).then(r => r.json());
      await device.load({ routerRtpCapabilities: rtpCapabilities });

      socket.emit("create-transport", { direction: "recv" }, transportInfo => {
        const transport = device.createRecvTransport(transportInfo);
        recvTransportRef.current = transport;

        transport.on("connect", ({ dtlsParameters }, callback) => {
          socket.emit("connect-transport", { transportId: transport.id, dtlsParameters });
          callback();
        });

        transport.on("connectionstatechange", async state => {
          if (state === "connected") {
            for (const pid of pendingProducersRef.current) await consumeProducer(pid);
            pendingProducersRef.current = [];
            tryPlayAudio();
          }
        });
      });
    };
    init();
  }, []);

  useEffect(() => {
    const handler = ({ producerId }) => consumeProducer(producerId);
    socket.on("new-producer", handler);

    const handleUnload = () => {
      if (recvTransportRef.current) recvTransportRef.current.close();
      if (audioRef.current?.srcObject) audioRef.current.srcObject.getTracks().forEach(t => t.stop());
      pendingProducersRef.current = [];
      consumedRef.current.clear();
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      socket.off("new-producer", handler);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [audioUnlocked]);

  useEffect(() => {
    const listener = () => { if (!audioUnlocked) unlockAudio(); };
    window.addEventListener("click", listener);
    return () => window.removeEventListener("click", listener);
  }, [audioUnlocked]);

  return <audio ref={audioRef} autoPlay />;
}
