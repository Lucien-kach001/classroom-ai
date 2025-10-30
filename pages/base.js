import { useEffect, useState } from "react";

function ChatBox({messages, onSend}) {
  const [t, setT] = useState("");
  return (
    <div style={{display:"flex", flexDirection:"column", gap:8, width:"100%", maxWidth:900}}>
      <div style={{height:340, overflow:"auto", border:"1px solid #ccc", padding:12, background:"#fff"}}>
        {messages.length === 0 && <div style={{color:"#666"}}>No messages yet — ask the student AI a question.</div>}
        {messages.map((m,i)=> <div key={i} style={{marginBottom:8}}><b>{m.from}:</b> <span>{m.text}</span></div>)}
      </div>
      <div style={{display:"flex", gap:8}}>
        <input style={{flex:1, padding:8}} value={t} onChange={e=>setT(e.target.value)} placeholder="Ask the student AI..." />
        <button onClick={()=>{ onSend(t); setT(""); }}>Send</button>
      </div>
    </div>
  );
}

export default function BasePage() {
  const [messages, setMessages] = useState([]);
  useEffect(()=> {
    const saved = localStorage.getItem("base_chat");
    if (saved) setMessages(JSON.parse(saved));
  }, []);
  useEffect(()=> localStorage.setItem("base_chat", JSON.stringify(messages)), [messages]);

  async function send(msg) {
    if (!msg) return;
    const userMsg = { from: "You", text: msg, ts: Date.now() };
    setMessages(m=>[...m, userMsg]);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: {"content-type":"application/json"},
        // v v v THIS IS THE UPDATED LINE v v v
        body: JSON.stringify({ prompt: `A student asked: ${msg}. Answer helpfully but do not do the homework for them.` })
        // ^ ^ ^ Removed the "model: gpt-4o-mini" key-value pair ^ ^ ^
      });
      const j = await r.json();
      const aiMsg = { from: "Tinny Ai", text: j.text || "AI unavailable", ts: Date.now() };
      setMessages(m=>[...m, aiMsg]);
    } catch(e) {
      setMessages(m=>[...m, { from: "Tinny Ai", text: "Error contacting LLM", ts: Date.now() }]);
    }
  }

  return (
    <div style={{padding:20, fontFamily:"Arial, sans-serif"}}>
      <h2>Student Base (local-only)</h2>
      <p style={{color:"#555"}}>This page stores your chats in the browser localStorage only. Teachers cannot access these chats.</p>
      <ChatBox messages={messages} onSend={send} />
      <div style={{marginTop:12}}>
        <button onClick={()=>{ localStorage.removeItem("base_chat"); setMessages([]); }}>Clear local saved chats</button>
      </div>
    </div>
  );
}
