import { useRef, useState, useEffect } from "react";
import "./SongPanel.css";

export default function SongPanel({ socket, room }) {
  const [phase, setPhase] = useState("idle"); // idle | singing | scoring
  const [listeners, setListeners] = useState([]);
  const [micLevel, setMicLevel] = useState(0);
  const [myScore, setMyScore] = useState(null);
  const [avgScore, setAvgScore] = useState(null); // 全體平均分
  const [scoreCount, setScoreCount] = useState(0);

  const localStreamRef = useRef(null);
  const pcsRef = useRef(new Map());
  const audioRefs = useRef(new Map());
  const listenerPCRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);

  // ===== 開始唱歌 =====
  const startSinging = async () => {
    if (phase !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateMicMeter = () => {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avg = dataArrayRef.current.reduce((a,b)=>a+b,0)/dataArrayRef.current.length;
        setMicLevel(avg / 255);
        animationIdRef.current = requestAnimationFrame(updateMicMeter);
      };
      updateMicMeter();

      setPhase("singing");
      setMyScore(null);
      setAvgScore(null);
      setScoreCount(0);

      socket.emit("start-singing", { room, singer: socket.id });
    } catch(e) {
      console.error("麥克風失敗", e);
    }
  };

  // ===== 停止唱歌 =====
  const stopSinging = () => {
    if (phase !== "singing") return;

    // 停止本地 stream
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current = null;

    cancelAnimationFrame(animationIdRef.current);
    audioCtxRef.current?.close();

    // 關閉所有對聽眾的 PC
    pcsRef.current.forEach((pc, listenerId) => {
      pc.close();
      socket.emit("listener-left", { room, listenerId });
    });
    pcsRef.current.clear();

    // 移除所有 audio
    audioRefs.current.forEach(a => {
      a.pause();
      a.srcObject = null;
      a.remove();
    });
    audioRefs.current.clear();

    setMicLevel(0);
    setPhase("scoring");

    socket.emit("stop-singing", { room, singer: socket.id });

    // 15 秒後回 idle
    setTimeout(() => setPhase("idle"), 15000);
  };

  // ===== 評分 =====
  const scoreSong = (score) => {
    if (phase !== "scoring") return;
    setMyScore(score);
    socket.emit("scoreSong", { room, score });
  };

  // ===== 聽眾控制 =====
  const startListening = () => socket.emit("listener-ready", { room, listenerId: socket.id });
  const stopListening = () => socket.emit("stop-listening", { room, listenerId: socket.id });

  // ===== 唱歌者 → 新聽眾 =====
  useEffect(() => {
    socket.on("new-listener", async ({ listenerId }) => {
      if (phase !== "singing" || !localStreamRef.current) return;
      if (pcsRef.current.has(listenerId)) return;

      const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));

      pc.onicecandidate = e => {
        if(e.candidate) socket.emit("webrtc-candidate",{to:listenerId,candidate:e.candidate});
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer",{to:listenerId, offer});

      pcsRef.current.set(listenerId, pc);
    });

    socket.on("listener-left", ({ listenerId }) => {
      const pc = pcsRef.current.get(listenerId);
      if(pc) pc.close();
      pcsRef.current.delete(listenerId);

      const audio = audioRefs.current.get(listenerId);
      if(audio) {
        audio.pause(); audio.srcObject=null; audio.remove();
        audioRefs.current.delete(listenerId);
      }
    });

    socket.on("webrtc-answer", async ({ from, answer }) => {
      const pc = pcsRef.current.get(from);
      if(pc) await pc.setRemoteDescription(answer);
    });

    socket.on("webrtc-candidate", async ({ from, candidate }) => {
      const pc = pcsRef.current.get(from);
      if(pc) await pc.addIceCandidate(candidate).catch(()=>{});
    });

    return () => {
      socket.off("new-listener"); socket.off("listener-left");
      socket.off("webrtc-answer"); socket.off("webrtc-candidate");
    };
  }, [socket, phase]);

  // ===== 聽眾接收音訊 =====
  useEffect(()=>{
    socket.on("webrtc-offer", async ({from, offer})=>{
      if(phase==="singing") return;

      const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
      listenerPCRef.current = pc;

      pc.ontrack = e => {
        let audio = audioRefs.current.get(from);
        if(!audio){
          audio=document.createElement("audio");
          audio.autoplay=true;
          document.body.appendChild(audio);
          audioRefs.current.set(from, audio);
        }
        audio.srcObject=e.streams[0];
      };

      pc.onicecandidate = e => {
        if(e.candidate) socket.emit("webrtc-candidate",{to:from, candidate:e.candidate});
      };

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer",{to:from, answer});
    });

    return ()=>socket.off("webrtc-offer");
  },[socket, phase]);

  // ===== 聽眾清理 =====
  useEffect(()=>{
    const onListenerLeft = () => {
      if(listenerPCRef.current){ listenerPCRef.current.close(); listenerPCRef.current=null; }
      audioRefs.current.forEach(a=>{ a.pause(); a.srcObject=null; a.remove(); });
      audioRefs.current.clear();
    };
    socket.on("listener-left", onListenerLeft);
    return ()=>socket.off("listener-left", onListenerLeft);
  },[socket]);

  // ===== 更新聽眾列表 =====
  useEffect(()=>{
    socket.on("update-listeners", ({listeners})=>setListeners(listeners||[]));
    return ()=>socket.off("update-listeners");
  },[socket]);

  // ===== 接收 songResult 更新平均分 =====
  useEffect(()=>{
    socket.on("songResult", ({avg, count})=>{
      setAvgScore(avg); 
      setScoreCount(count);
    });
    return ()=>socket.off("songResult");
  },[socket]);

  // ===== UI =====
  return (
    <div className="song-panel">
      <h4>🎤 唱歌區</h4>

      <button onClick={startSinging} disabled={phase!=="idle"}>開始唱歌</button>
      <button onClick={stopSinging} disabled={phase!=="singing"}>停止唱歌</button>

      {(phase==="singing" || phase==="scoring") && (
        <div className="mic-meter">
          {phase==="singing" && <div className="mic-bar" style={{width:`${micLevel*100}%`}} />}
          {phase==="scoring" && (
            <div className="my-score">
              {myScore ? <>你給了 <strong>{myScore}</strong> 分 ⭐</> : <>請評分…</>}
              {avgScore!==null && <> / 平均: {avgScore.toFixed(1)} ({scoreCount}人)</>}
            </div>
          )}
        </div>
      )}

      {phase==="scoring" && (
        <div className="score-buttons">
          {[1,2,3,4,5].map(n=><button key={n} onClick={()=>scoreSong(n)}>{n}</button>)}
        </div>
      )}

      <div className="listeners">
        <h4>聽眾 ({listeners.length})</h4>
        {phase!=="singing" && <>
          <button onClick={startListening}>開始聽歌</button>
          <button onClick={stopListening}>取消聽歌</button>
        </>}
      </div>
    </div>
  );
}
