import { useState, useEffect } from "react";

// FIX 3: New component to handle client-side time formatting.
function LastSeenTime({ lastSeen }) {
  const [time, setTime] = useState("—");

  useEffect(() => {
    if (lastSeen) {
      // This runs only on the client after the page has hydrated
      setTime(new Date(lastSeen).toLocaleTimeString());
    }
  }, [lastSeen]);

  return <span style={{fontSize:12, color:"#666"}}>{time}</span>;
}

export default function TeacherPage(){
  const [teacherName, setTeacherName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [allowedTools, setAllowedTools] = useState("search,calculator");
  const [sessionCode, setSessionCode] = useState("");
  const [teacherToken, setTeacherToken] = useState("");
  const [studentsViews, setStudentsViews] = useState({});
  const [reports, setReports] = useState({});

  async function create() {
    const r = await fetch("/api/create-session", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({
        teacherName, subject, gradeLevel,
        allowedTools: allowedTools.split(",").map(s=>s.trim()), viewEnabled: true
      })
    });
    const j = await r.json();
    if (j.code) {
      setSessionCode(j.code);
      setTeacherToken(j.teacherToken);
    } else {
      alert("Error creating session");
    }
  }

  useEffect(()=>{
    let mounted = true;
    async function poll(){
      while(mounted){
        if(sessionCode && teacherToken){
          try {
            const v = await fetch(`/api/get-views?code=${encodeURIComponent(sessionCode)}&token=${encodeURIComponent(teacherToken)}`);
            const vv = await v.json();
            setStudentsViews(vv.students || {});
            const rep = await fetch(`/api/get-reports?code=${encodeURIComponent(sessionCode)}&token=${encodeURIComponent(teacherToken)}`);
            const jrep = await rep.json();
            setReports(jrep.reports || {});
          } catch(e){}
        }
        await new Promise(r=>setTimeout(r,5000));
      }
    }
    poll();
    return ()=> mounted=false;
  }, [sessionCode, teacherToken]);

  async function sendWarning(studentName) {
    const text = prompt("Warning text to show for 10 seconds:");
    if (!text) return;
    await fetch("/api/send-warning", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({ code: sessionCode, token: teacherToken, studentName, text })
    });
    alert("Warning sent");
  }

  return (
    <div style={{padding:20, fontFamily:"Arial, sans-serif"}}>
      <h2>Teacher Console</h2>
      {!sessionCode ? (
        <div style={{display:"flex", gap:8, flexDirection:"column", maxWidth:760}}>
          <input placeholder="Your name" value={teacherName} onChange={e=>setTeacherName(e.target.value)} />
          <input placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
          <input placeholder="Grade Level" value={gradeLevel} onChange={e=>setGradeLevel(e.target.value)} />
          <input placeholder="Allowed tools (comma)" value={allowedTools} onChange={e=>setAllowedTools(e.target.value)} />
          <div>
            <label style={{fontSize:13}}>View enabled: </label>
            <input type="checkbox" defaultChecked />
          </div>
          <button onClick={create}>Create session</button>
        </div>
      ) : (
        <div>
          <div style={{marginBottom:12}}>Session code: <b>{sessionCode}</b></div>
          <div style={{marginBottom:8}}>Teacher token (secret): <code>{teacherToken}</code></div>
          <h3>Student views & reports</h3>
          <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
            {Object.keys(studentsViews).length === 0 && <div style={{color:"#666"}}>No students yet</div>}
            {Object.entries(studentsViews).map(([name, info]) => (
              <div key={name} style={{border:"1px solid #ddd", padding:8, width:260, borderRadius:6, background:"#fafafa"}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <b>{name}</b>
                  {/* FIX 3: Use the new component */}
                  <LastSeenTime lastSeen={info.lastSeen} />
                </div>
                <div style={{height:120, overflow:"auto", background:"#fff", marginTop:8, padding:8}}>
                  {(info.lastView?.snapshot || []).map((m,i)=>(<div key={i}><b>{m.from}:</b> {m.text}</div>))}
                </div>
                <div style={{marginTop:8, display:"flex", gap:8}}>
                  <button onClick={()=>sendWarning(name)}>Send warning</button>
                </div>
                <div style={{marginTop:8}}>
                  <b>Last report:</b>
                  <div style={{fontSize:13, color:"#333", marginTop:6}}>
                    {(info.lastReport && info.lastReport.report) || (reports[name] && reports[name].report) || <span style={{color:"#666"}}>No report</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
