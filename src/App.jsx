import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

export default function App(){
  const [room,setRoom]=useState("public");
  const [name,setName]=useState("訪客"+Math.floor(Math.random()*999));
  const [messages,setMessages]=useState([]);
  const [text,setText]=useState("");
  const [joined,setJoined]=useState(false);

  useEffect(()=>{
    socket.on("message",(m)=>setMessages(s=>[...s,m]));
    socket.on("systemMessage",(m)=>setMessages(s=>[...s,{user:{name:'系統'},message:m}]));
    return ()=> { socket.off("message"); socket.off("systemMessage"); }
  },[]);

  const join = ()=>{ socket.emit("joinRoom",{room,user:{name}}); setJoined(true); }
  const send = ()=>{
    if(!text) return;
    socket.emit("message",{room,message:text,user:{name}});
    setText("");
  };

  return (
    <div style={{padding:"20px", maxWidth:"720px", margin:"auto", fontFamily:'Arial, sans-serif'}}>
      <h2>尋夢園 聊天室（免費部署版）</h2>
      <div style={{marginBottom:8}}>
        暱稱：<input value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div style={{marginBottom:8}}>
        房間：
        <select value={room} onChange={e=>setRoom(e.target.value)}>
          <option value="public">大廳</option>
        </select>
        <button onClick={join} style={{marginLeft:8}}>加入</button>
      </div>

      <div style={{border:"1px solid #ddd", height:320, overflow:"auto", padding:8, background:'#fafafa'}}>
        {messages.map((m,i)=>(
          <div key={i} style={{marginBottom:6}}>
            <strong>{m.user?.name}：</strong><span>{m.message}</span>
          </div>
        ))}
        {!messages.length && <div style={{color:'#666'}}>還沒有人發話，打個招呼吧！</div>}
      </div>

      <div style={{marginTop:8}}>
        <input value={text} onChange={e=>setText(e.target.value)}
         onKeyDown={e=> e.key==="Enter" && send()} style={{width:'70%'}}/>
        <button onClick={send} style={{marginLeft:8}}>發送</button>
      </div>

      <div style={{marginTop:12, color:'#888', fontSize:12}}>
        小提醒：在訊息中提到 <code>@bot</code> 可叫 AI 回覆（後端需設定 API key）。
      </div>
    </div>
  )
}
