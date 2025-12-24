import "./SongPanel.css";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
const socket = io(BACKEND, { transports: ["websocket"] });

export default function SongPanel({ room, name }) {
  const [phase, setPhase] = useState("idle"); 
  const [micLevel, setMicLevel] = useState(0);
  const [myScore, setMyScore] = useState(null);
  const [avgScore, setAvgScore] = useState(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [scoreCountdown, setScoreCountdown] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentSinger, setCurrentSinger] = useState(null);
  const [joinedQueue, setJoinedQueue] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [listeningUrl, setListeningUrl] = useState(null);

  const localStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);
  const countdownRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const joinQueue = () => {
    if (joinedQueue || phase === "recording") return;
    socket.emit("joinQueue", { room, singer: name });
    setJoinedQueue(true);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    // 麥克風音量分析
    audioCtxRef.current = new AudioContext();
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateMic = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avg = dataArrayRef.current.reduce((a,b)=>a+b,0)/dataArrayRef.current.length;
      setMicLevel(avg/255);
      animationIdRef.current = requestAnimationFrame(updateMic);
    };
    updateMic();

    // MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setRecordedBlob(blob);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1];
        fetch(`${BACKEND}/song/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: base64data, singer: name })
        })
        .then(res=>res.json())
        .then(data=>{
          socket.emit("songReady", { room, singer: name, url: data.url, duration: Math.ceil(blob.duration) });
        });
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    setPhase("recording");
  };

  const stopRecording = () => {
    if(phase!=="recording") return;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current = null;
    cancelAnimationFrame(animationIdRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current=null;
    dataArrayRef.current=null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current=null;
    setPhase("scoring");
  };

  const scoreSong = (score)=>{
    if(phase!=="scoring") return;
    setMyScore(score);
    socket.emit("scoreSong",{room,score});
  };

  useEffect(()=>{
    socket.on("queueUpdate",({queue,current})=>{
      setQueue(queue);
      setCurrentSinger(current);
      if(current===name && phase==="idle") startRecording();
    });
    socket.on("playSong",({url,duration})=>{
      setListeningUrl(url);
      setScoreCountdown(Math.ceil(duration));
      setPhase("scoring");
    });
    socket.on("songResult",({avg,count})=>{
      setAvgScore(avg);
      setScoreCount(count);
      setPhase("idle");
      setMyScore(null);
      setScoreCountdown(0);
      setJoinedQueue(false);
      setRecordedBlob(null);
      setListeningUrl(null);
    });

    const handleUnload = ()=>{
      stopRecording();
      if(joinedQueue) socket.emit("leaveQueue",{room,singer:name});
    };
    window.addEventListener("beforeunload",handleUnload);

    return ()=>{
      socket.off("queueUpdate");
      socket.off("playSong");
      socket.off("songResult");
      window.removeEventListener("beforeunload",handleUnload);
    };
  },[phase,joinedQueue,name]);

  const getBlobDuration = (blob)=>new Promise(resolve=>{
    const tempAudio=document.createElement("audio");
    tempAudio.src=URL.createObjectURL(blob);
    tempAudio.addEventListener("loadedmetadata",()=>resolve(tempAudio.duration));
  });

  return (
    <div className="song-panel">
      <h4>🎤 唱歌區</h4>
      <div>當前: {currentSinger||"--"} / 我的狀態: {phase}</div>
      <div className="controls">
        <button onClick={joinQueue} disabled={phase==="recording"||phase==="scoring"||joinedQueue}>加入隊列</button>
        <button onClick={startRecording} disabled={phase!=="idle"||currentSinger!==name}>開始錄音</button>
        <button onClick={stopRecording} disabled={phase!=="recording"}>停止錄音</button>
      </div>
      {(phase==="recording"||phase==="scoring") && <div className="mic-meter">{phase==="recording"&&<div style={{width:`${micLevel*100}%`}}/>}</div>}
      {phase==="scoring" && (
        <div>
          <div>評分倒數：{scoreCountdown} 秒</div>
          <div>{[1,2,3,4,5].map(n=><span key={n} style={{cursor:'pointer',color:myScore>=n?'gold':'gray'}} onClick={()=>scoreSong(n)}>★</span>)}</div>
          {listeningUrl && <audio src={listeningUrl} controls autoPlay/>}
        </div>
      )}
      <div>上一位平均：{avgScore!==null?avgScore.toFixed(1):"--"} 分（{scoreCount} 人）</div>
      <div>排隊名單：{queue.length?queue.join(" / "):"--"}</div>
    </div>
  );
}
