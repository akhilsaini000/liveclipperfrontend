// Set this to your deployed HTTPS backend URL, e.g. https://api.example.com
const API_BASE = "https://live-clipper-1.onrender.com";
const $ = id => document.getElementById(id);
async function poll(id) {
  for (;;) {
    const r=await fetch(`${API_BASE}/api/jobs/${id}`); const j=await r.json();
    $("status").textContent = j.status==="processing" ? "AI is analysing your video…" : j.status==="recording" ? "Live capture running…" : j.status==="error" ? `Error: ${j.error}` : "Finished.";
    if(j.clips?.length) renderClips(j.clips);
    if(["done","error"].includes(j.status)) break;
    await new Promise(res=>setTimeout(res,4000));
  }
}
function renderClips(clips) {
  $("clips").innerHTML="";
  clips.forEach(c=>{
    const div=document.createElement("div"); div.className="clip";
    const v=document.createElement("video"); v.controls=true; v.playsInline=true; v.src=API_BASE+c.url;
    const meta=document.createElement("small"); meta.textContent=`${c.reason||"Highlight"} · ${c.start??""}–${c.end??""} sec · score ${c.score??"—"}`;
    const a=document.createElement("a"); a.href=API_BASE+c.url; a.download=c.filename; a.textContent="Save clip";
    a.style.color="#b8adff"; a.style.display="inline-block"; a.style.marginTop="8px";
    div.append(v,meta,a); $("clips").append(div);
  });
}
$("go").onclick=async()=>{
  const f=$("file").files[0], url=$("url").value.trim();
  if(!f&&!url){$("status").textContent="Choose a video or enter a YouTube URL.";return;}
  const fd=new FormData(); if(f)fd.append("file",f); fd.append("youtube_url",url);
  fd.append("category",$("category").value); fd.append("duration",$("duration").value);
  fd.append("aspect",$("aspect").value); fd.append("subtitles",$("subs").checked);
  $("go").disabled=true; $("status").textContent="Uploading…";
  try{const r=await fetch(`${API_BASE}/api/process`,{method:"POST",body:fd});const j=await r.json();if(!r.ok)throw Error(j.detail||"Request failed");await poll(j.job_id);}
  catch(e){$("status").textContent=e.message;} finally{$("go").disabled=false;}
};
$("live").onclick=async()=>{
 const fd=new FormData();fd.append("url",$("liveurl").value);fd.append("segment_minutes",$("segment").value);
 $("status").textContent="Starting live capture…";
 try{const r=await fetch(`${API_BASE}/api/live`,{method:"POST",body:fd});const j=await r.json();if(!r.ok)throw Error(j.detail||"Could not start");poll(j.job_id);}
 catch(e){$("status").textContent=e.message;}
};
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
