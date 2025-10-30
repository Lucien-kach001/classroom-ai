import { useEffect, useState, useRef } from "react";

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

export default function StudentPage(){
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const warningRef = useRef(null);

  useEffect(()=> {
    const saved = localStorage.getItem("student_base_chat");
    if (saved) setMessages(JSON.parse(saved));
  }, []);
  useEffect(()=> localStorage.setItem("student_base_chat", JSON.stringify(messages)), [messages]);

  async function join() {
    if (!code) return alert("Enter session code");
    const resp = await fetch(`/api/get-session?code=${encodeURIComponent(code)}`);
    const j = await resp.json();
    if (j.error) return alert("Session not found");
    setSession(j);
  }

  // poll warnings
  useEffect(()=>{
    if(!session || !name) return;
    let mounted = true;
    (async function poll(){
      while(mounted){
        try{
          const r = await fetch(`/api/poll-warnings?code=${encodeURIComponent(code)}&studentName=${encodeURIComponent(name)}`);
          const j = await r.json();
          if (j.active) {
            // push a SYSTEM message (teacher warning popup UI could also be added)
            setMessages(m=>[...m, {from:"SYSTEM", text:`Teacher warning: ${j.text}`, ts:Date.now()}]);
          }
        }catch(e){}
        await sleep(5000);
      }
    })();
    return ()=> mounted=false;
  }, [session, name]);

  // push view snapshots if enabled
  useEffect(()=>{
    if(!session || !name) return;
    let mounted = true;
    (async function pushViewLoop(){
      while(mounted){
        if(session.viewEnabled){
          const visible = messages.slice(-8).map(m=>({from:m.from, text: m.text}));
          await fetch("/api/push-view", {
            method:"POST",
            headers:{"content-type":"application/json"},
            body: JSON.stringify({ code, studentName: name, snapshot: visible })
          });
        }
        await sleep(5000);
      }
    })();
    return ()=> mounted=false;
  }, [session, name, messages]);

  async function send(msg) {
    if (!msg) return;
    const um = { from: name || "Student", text: msg, ts: Date.now() };
    setMessages(m=>[...m, um]);
    // server-side LLM response (via /api/generate)
    try {
      const prompt = `Student (grade ${session?.gradeLevel || "N/A"}) asked: ${msg}. Respond as a helpful classroom assistant. Don't do the homework for them.`;
      const r = await fetch("/api/generate", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ prompt }) 
      });
      
      // *** FIX: Check for successful response before parsing JSON ***
      if (!r.ok) {
          throw new Error(`API Error: ${r.statusText} (${r.status})`); 
      }
      
      const j = await r.json();
      setMessages(m=>[...m, { from: "Tinny Ai", text: j.text || "No reply", ts: Date.now() }]);
    } catch(e) {
      console.error("LLM fetch failed:", e); 
      setMessages(m=>[...m, { from: "Tinny Ai", text: "Error contacting LLM", ts: Date.now() }]);
    }
  }

  // client-side summary and send to teacher (privacy-first)
  async function clientSummarizeAndSend(){
    const last = messages.slice(-20).map(m=>`${m.from}: ${m.text}`).join("\n");
    const sentences = last.split(/[.?!]\s/).slice(0,6).join(". ");
    const summary = `AUTO SUMMARY: ${sentences || "No recent messages."}`;
    await fetch("/api/push-report", {
      method:"POST",
      headers:{"content-type":"application/json"},
      body: JSON.stringify({ code, studentName: name, report: summary })
    });
    setMessages(m=>[...m, { from: "SYSTEM", text: "Sent private summary to teacher (client-side)", ts: Date.now() }]);
  }

  return (
    <div style={{padding:20, fontFamily:"Arial, sans-serif"}}>
      {!session ? (
        <div style={{maxWidth:760}}>
          <h3>Join Teacher Session</h3>
          <div style={{display:"flex", gap:8}}>
            <input placeholder="Session code" value={code} onChange={e=>setCode(e.target.value)} />
            <button onClick={join}>Fetch Session</button>
          </div>
        </div>
      ) : (
        <div style={{maxWidth:1100}}>
          <h3>Session for {session.subject || "General"} — Grade {session.gradeLevel || "?"}</h3>
          {!name ? (
            <div style={{display:"flex", gap:8}}>
              <input placeholder="Type your name (AI will use this)" value={name} onChange={e=>setName(e.target.value)} />
              <button onClick={()=>{ if(!name) return alert("Enter name"); setMessages(m=>[...m, {from:"SYSTEM", text:`${name} joined the session`, ts:Date.now()}]); }}>Join</button>
            </div>
          ) : (
            <div style={{display:"flex", gap:20}}>
              <div style={{flex:1}}>
                <div style={{height:320, overflow:"auto", border:"1px solid #ccc", padding:8, background:"#fff"}}>
                  {messages.map((m,i)=>(<div key={i}><b>{m.from}:</b> {m.text}</div>))}
                </div>
                <StudentControls onSend={send} onSummarize={clientSummarizeAndSend} />
              </div>
              <div style={{width:320, borderLeft:"1px solid #eee", paddingLeft:12}}>
                <h4>Session Info</h4>
                <div><b>Teacher Subject:</b> {session.subject}</div>
                <div><b>Allowed tools:</b> {session.allowedTools?.join(", ")}</div>
                <div><b>View enabled:</b> {String(session.viewEnabled)}</div>
                <div style={{marginTop:8, fontSize:13, color:"#666"}}>Note: this client stores full chat locally. Private summaries are optional and sent to the teacher only when you press "Send private summary".</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentControls({onSend, onSummarize}) {
  const [t, setT] = useState("");
  return (
    <div style={{marginTop:8, display:"flex", gap:8}}>
      <input style={{flex:1, padding:8}} value={t} onChange={e=>setT(e.target.value)} placeholder="Ask the AI..." />
      <button onClick={()=>{ onSend(t); setT(""); }}>Send</button>
      <button onClick={()=>onSummarize()}>Send private summary</button>
    </div>
  );
}
