/* ================= live data: Supabase ================= */
var SB_URL="https://ccqpmbcytrcxngnlooon.supabase.co",SB_KEY="sb_publishable_SbkMpYDQN-0FA92vFKeVaA_85mQn7dJ";
var sb=window.__sbMock||supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"keenest-clock-auth"}});
var D={all:[],emps:[],punches:[],reqs:[],oscar:"",office:{},demo:{weather:"",day:"",loc:"office"},meId:null,role:null};
var KO={lat:32.0635,lng:34.8575};/* Kiryat Ono, for the weather until the office spot is set */
function save(){}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function emp(id){return D.all.find(function(e){return e.id===id})}
function me(){return D.meId}
function isMgr(){return D.role==="manager"}
function punchOf(id,date){return D.punches.find(function(p){return p.emp===id&&p.date===date})}
function reqsOf(id){return D.reqs.filter(function(r){return r.emp===id})}
function workDays(a,b){var n=0,d=parse(a),e=parse(b);while(d<=e){if(isWork(d))n++;d=addDays(d,1)}return n}
function onVac(id,date,st){return D.reqs.some(function(r){return r.emp===id&&(r.type==="vac"||r.type==="sick")&&(st?r.status===st:r.status!=="no")&&r.from<=date&&r.to>=date})}
function vacUsed(id){var y=new Date().getFullYear();return D.reqs.filter(function(r){return r.emp===id&&r.type==="vac"&&r.status==="ok"&&parse(r.from).getFullYear()===y}).reduce(function(s,r){return s+r.days},0)}
function sickUsed(id){var y=new Date().getFullYear();return D.reqs.filter(function(r){return r.emp===id&&r.type==="sick"&&parse(r.from).getFullYear()===y}).reduce(function(s,r){return s+r.days},0)}
function t5(t){return t?String(t).slice(0,5):null}
function errMsg(e){var m=(e&&(e.message||e.error))||"";if(/already_in/.test(m))return "כבר נכנסת היום";if(/not_in/.test(m))return "לא נמצאה כניסה היום";if(/not_employee/.test(m))return "המשתמש לא מוגדר כעובד";if(/Failed to fetch|NetworkError|network/i.test(m))return "אין חיבור לאינטרנט. נסה שוב";return "משהו השתבש. נסה שוב"}
async function rpc(name,args){var r=await sb.rpc(name,args||{});if(r.error)throw r.error;return r.data}

async function loadAll(){
  var since=iso(addDays(new Date(),-400));
  var res=await Promise.all([sb.from("employees").select("*"),sb.from("punches").select("*").gte("day",since),sb.from("requests").select("*").order("created_at"),sb.from("settings").select("*")]);
  res.forEach(function(r){if(r.error)throw r.error});
  D.all=res[0].data.map(function(x){return {id:x.id,name:x.name,cls:x.cls||"a",start:x.start_date||"",birthday:x.birthday||"",vac:x.vac_per_year,role:x.role,email:x.email,code:x.invite_code}});
  D.all.sort(function(a,b){return a.role===b.role?(a.name<b.name?-1:1):(a.role==="employee"?-1:1)});
  D.emps=D.all.slice();
  D.punches=res[1].data.map(function(p){return {id:p.id,emp:p.emp,date:p.day,in:t5(p.in_time),out:t5(p.out_time),inLoc:p.in_loc||"",outLoc:p.out_loc||"",note:p.note||"",pending:p.pending}});
  D.reqs=res[2].data.map(function(r){return {id:r.id,emp:r.emp,type:r.type,from:r.from_date,to:r.to_date,days:r.days,status:r.status,late:r.late,note:r.note||"",date:r.fix_day,inT:t5(r.fix_in),outT:t5(r.fix_out),oldIn:t5(r.old_in),oldOut:t5(r.old_out),created:(r.created_at||"").slice(0,10)}});
  D.settings={};res[3].data.forEach(function(s){D.settings[s.key]=s.value});
  D.office=D.settings.office||{};D.oscar=D.settings.oscar||"";
  var mine=await rpc("my_emp");D.meId=mine;var m=emp(mine);D.role=m?m.role:null;
  D.pre={};D.punches.forEach(function(){});
}

/* ---------- weather (Open-Meteo, free, no key) ---------- */
async function loadWeather(){var key="kc-wx-"+iso(new Date()),c=ls(key);if(c!==null){D.demo.weather=c;return}
  try{var o=D.office&&D.office.lat?D.office:KO;
    var r=await fetch("https://api.open-meteo.com/v1/forecast?latitude="+o.lat+"&longitude="+o.lng+"&daily=weather_code,temperature_2m_max,wind_speed_10m_max,precipitation_sum&timezone=Asia%2FJerusalem&forecast_days=1");
    var j=await r.json(),d=j.daily,code=d.weather_code[0],tmax=d.temperature_2m_max[0],wind=d.wind_speed_10m_max[0],rain=d.precipitation_sum[0];
    var w=(rain>=1||(code>=51&&code<=67)||(code>=80&&code<=82)||code>=95)?"rain":tmax>=32?"heat":tmax<=14?"cold":wind>=40?"wind":"";
    D.demo.weather=w;ls(key,w)}catch(e){D.demo.weather=""}}

/* ---------- location ---------- */
function getPos(){return new Promise(function(res){if(!navigator.geolocation)return res(null);
  navigator.geolocation.getCurrentPosition(function(p){res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy})},function(){res(null)},{enableHighAccuracy:true,timeout:9000,maximumAge:60000})})}
function distM(a,b){var R=6371000,t=Math.PI/180,dLat=(b.lat-a.lat)*t,dLng=(b.lng-a.lng)*t,x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dLng/2)*Math.sin(dLng/2);return 2*R*Math.asin(Math.sqrt(x))}
function whereIs(pos){var o=D.office;if(!pos||!o||!o.lat)return "unknown";return distM(pos,o)<=(o.radius||200)+Math.min(pos.acc||0,150)?"office":"out"}
async function geocodeOffice(){if(!isMgr()||!D.office||D.office.lat||!D.office.address)return;
  try{var r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&q="+encodeURIComponent(D.office.address));var j=await r.json();
    if(j&&j[0]){D.office.lat=+j[0].lat;D.office.lng=+j[0].lon;await sb.from("settings").update({value:D.office}).eq("key","office")}}catch(e){}}

/* ---------- today: real actions ---------- */
var busy=false;
async function act(){if(busy)return;var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);if(p&&p.out)return;busy=true;$("#slbl").textContent="רגע…";
  var pos=await getPos(),loc=whereIs(pos);busy=false;
  if(!p){if(loc==="out"){var b=pop('<h3>אתה לא במשרד</h3><p>בטוח שאתה רוצה לעשות כניסה מכאן?</p><div class="btns"><button class="bp" id="goIn">כניסה בכל זאת</button><button class="bs">ביטול</button></div>');
      b.querySelector("#goIn").onclick=function(){closePop();clockIn(loc,pos)};b.querySelector(".bs").onclick=function(){closePop();render()};return}clockIn(loc,pos);return}
  if(loc==="out"){outAway(p,pos);return}clockOut(loc,pos,null)}
async function clockIn(loc,pos){try{var r=await rpc("clock_in",{loc:loc,lat:pos&&pos.lat,lng:pos&&pos.lng});await refresh();toast("בוקר טוב! נכנסת ב־"+t5(r.in_time))}catch(e){await refresh();toast(errMsg(e))}}
async function clockOut(loc,pos,earlier){try{var r=await rpc("clock_out",{loc:loc,lat:pos&&pos.lat,lng:pos&&pos.lng,earlier:earlier});await refresh();toast(earlier?"שעת היציאה נשלחה לאישור":"יצאת ב־"+t5(r.out_time)+". ערב טוב!")}catch(e){await refresh();toast(errMsg(e))}}
function outAway(p,pos){var b=pop('<h3>אתה לא במשרד</h3><p class="sub">מתי יצאת?</p><div class="seg" id="whenSeg"><button type="button" aria-pressed="true" data-w="now">עכשיו</button><button type="button" aria-pressed="false" data-w="before">קודם</button></div><div class="form" id="tBox" hidden><div class="fld"><label for="outT">שעת יציאה</label><input id="outT" type="time" value="'+hm(new Date())+'"></div></div><p id="tNote" hidden>שעה מוקדמת נשלחת לאישור של רן או צפריר.</p><div class="btns"><button class="bp" id="okOut">יציאה</button><button class="bs">ביטול</button></div>');
  var w="now";b.querySelectorAll("#whenSeg button").forEach(function(x){x.onclick=function(){w=x.dataset.w;b.querySelectorAll("#whenSeg button").forEach(function(y){y.setAttribute("aria-pressed",y===x)});b.querySelector("#tBox").hidden=w!=="before";b.querySelector("#tNote").hidden=w!=="before";b.querySelector("#okOut").textContent=w==="before"?"שליחה לאישור":"יציאה"}});
  b.querySelector(".bs").onclick=function(){closePop();render()};
  b.querySelector("#okOut").onclick=function(){if(w==="now"){closePop();clockOut("out",pos,null);return}var t=b.querySelector("#outT").value;if(!t)return;closePop();clockOut("out",pos,t)}}
function forgotOut(p){var b=pop('<h3>שכחת לצאת</h3><p class="sub">'+HEB_DAYS[parse(p.date).getDay()]+", "+nice(p.date)+'</p><p>נכנסת ב־'+p.in+' ולא נרשמה יציאה. מתי יצאת?</p><div class="form"><div class="fld"><label for="fo">שעת יציאה</label><input id="fo" type="time" value="18:00"></div></div><div class="btns"><button class="bp" id="foOk">שליחה לאישור</button><button class="bs">אחר כך</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#foOk").onclick=async function(){var t=b.querySelector("#fo").value;if(!t)return;closePop();try{await rpc("forgot_out",{p_day:p.date,t:t});await refresh();toast("נשלח לאישור של רן וצפריר")}catch(e){toast(errMsg(e))}}}
var forgotAsked={};
function afterToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);
  if(p&&!p.out){setVeil("in");playLook(todayLook())}else if(p&&p.out){setVeil("out");playLook(todayLook())}else{FX.stop();setVeil("")}
  $("#whereBtn").onclick=whereDialog;bindSlide();
  var open=D.punches.find(function(q){return q.emp===e.id&&!q.out&&q.date<g});
  if(open&&!forgotAsked[open.date]&&!D.reqs.some(function(r){return r.type==="fix"&&r.emp===e.id&&r.date===open.date&&r.status==="pending"})){forgotAsked[open.date]=1;setTimeout(function(){forgotOut(open)},700)}}
function viewToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g),look=todayLook(),vacToday=onVac(e.id,g,"ok");
  var st=!p?"before":p.out?"done":"in";
  var tHtml=st==="before"?'<span class="t wait">—:—</span>':st==="in"?'<span class="t">'+p.in+"</span>":'<span class="t pair">'+p.in+'<span class="dash"> – </span>'+p.out+"</span>";
  var lab=st==="before"?(vacToday?"היום אתה בחופשה":"עוד לא נכנסת"):st==="in"?"נכנסת ב":"היום";
  var note=(p&&p.note)||D.dayNote||"";
  var flag=p&&p.inLoc==="out"&&!note?'<span class="locflag">נכנסת מחוץ למשרד</span>':"";
  return '<section class="mock"><span class="d">יום '+HEB_DAYS[new Date().getDay()]+" · "+nice(g)+'</span><p class="q">'+esc(look.q)+'</p><span class="sp big"></span>'+
    '<span class="l">'+lab+"</span>"+tHtml+'<button type="button" class="where'+(note?" on":"")+'" id="whereBtn"><svg><use href="#i-pin"/></svg><span>'+(note?esc(note):"מחוץ למשרד היום?")+"</span></button>"+flag+
    '<span class="sp"></span><div class="slide'+(st==="in"?" exit":"")+(st==="done"?" done":"")+'" id="slide"><span class="knob" id="knob"><svg><use href="#i-arrow"/></svg></span><span class="lbl" id="slbl">'+(st==="before"?"החלק לכניסה":st==="in"?"החלק ליציאה":"יום טוב, נתראה מחר")+"</span></div></section>"}
function whereDialog(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);var cur=(p&&p.note)||D.dayNote||"";
  var b=pop('<h3>מחוץ למשרד היום?</h3><p class="sub">אפשר לכתוב איפה אתה, למשל צילומים</p><div class="chips">'+["צילומים","פגישה אצל לקוח","עבודה מהבית"].map(function(c){return '<button type="button">'+c+"</button>"}).join("")+'</div><textarea class="note" id="wn" placeholder="צילומים בנמל תל אביב">'+esc(cur)+'</textarea><div class="btns"><button class="bp" id="wOk">שמירה</button>'+(cur?'<button class="bred" id="wDel">בעצם אני במשרד</button>':"")+'<button class="bs">ביטול</button></div>');
  b.querySelectorAll(".chips button").forEach(function(c){c.onclick=function(){var ta=b.querySelector("#wn");ta.value=c.textContent+" ";ta.focus()}});
  b.querySelector(".bs").onclick=closePop;
  async function set(v){closePop();try{await rpc("set_day_note",{n:v});D.dayNote=v;await refresh()}catch(e){toast(errMsg(e))}}
  b.querySelector("#wOk").onclick=function(){set(b.querySelector("#wn").value.trim())};var dl=b.querySelector("#wDel");if(dl)dl.onclick=function(){set("")}}
function todayLook(){return dayLook(new Date(),emp(me()),null)}

/* ---------- requests ---------- */
function fixDialog(id,g){var p=punchOf(id,g);if(g>iso(new Date()))return;var b=pop('<h3>תיקון שעות</h3><p class="sub">'+HEB_DAYS[parse(g).getDay()]+", "+nice(g)+'</p><div class="form"><div class="fld"><label for="fi">כניסה</label><input id="fi" type="time" value="'+(p?p.in:"09:00")+'"></div><div class="fld"><label for="fo2">יציאה</label><input id="fo2" type="time" value="'+(p&&p.out?p.out:"18:00")+'"></div></div><textarea class="note" id="fr" placeholder="מה קרה? למשל שכחתי להחתים"></textarea><div class="btns"><button class="bp" id="fOk">שליחה לאישור</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#fOk").onclick=async function(){var a=b.querySelector("#fi").value,c=b.querySelector("#fo2").value;if(!a||!c)return;var n=b.querySelector("#fr").value.trim();closePop();
    try{await rpc("request_fix",{p_day:g,p_in:a,p_out:c,n:n});await refresh();toast("התיקון נשלח לאישור")}catch(e){toast(errMsg(e))}}}
function vacDialog(){var t0=addDays(new Date(),14);while(!isWork(t0))t0=addDays(t0,1);
  var b=pop('<h3>בקשת חופשה</h3><p class="sub">הבקשה תגיע לרן ולצפריר</p><div class="form"><div class="fld"><label for="vf">מתאריך</label><input id="vf" type="date" value="'+iso(t0)+'"></div><div class="fld"><label for="vt">עד תאריך</label><input id="vt" type="date" value="'+iso(t0)+'"></div></div><p id="vInfo"></p><textarea class="note" id="vn" placeholder="הערה, לא חובה"></textarea><div class="btns"><button class="bp" id="vOk">שליחת בקשה</button><button class="bs">ביטול</button></div>');
  function upd(){var f=b.querySelector("#vf").value,t=b.querySelector("#vt").value,info=b.querySelector("#vInfo");if(!f||!t||t<f){info.textContent="בחר תאריכים";return}
    var n=workDays(f,t),ahead=Math.round((parse(f)-parse(iso(new Date())))/864e5),need=noticeRule(n);info.innerHTML=n+" ימי עבודה"+(ahead<need?'<br><span class="warn">מומלץ לבקש '+(need===7?"שבוע":need===14?"שבועיים":"חודש")+" מראש. אפשר לשלוח, והבקשה תסומן כמאוחרת.</span>":"")}
  b.querySelector("#vf").oninput=function(){var vt=b.querySelector("#vt");if(vt.value<this.value)vt.value=this.value;upd()};b.querySelector("#vt").oninput=upd;upd();
  b.querySelector(".bs").onclick=closePop;b.querySelector("#vOk").onclick=async function(){var f=b.querySelector("#vf").value,t=b.querySelector("#vt").value;if(!f||!t||t<f)return;var n=b.querySelector("#vn").value.trim();closePop();
    try{await rpc("request_vac",{a:f,b:t,n:n});await refresh();toast("הבקשה נשלחה לרן וצפריר")}catch(e){toast(errMsg(e))}}}
function sickDialog(){var g=iso(new Date());var b=pop('<h3>דיווח מחלה</h3><p class="sub">לא צריך אישור מראש. רפואה שלמה!</p><div class="form"><div class="fld"><label for="sf">מתאריך</label><input id="sf" type="date" value="'+g+'"></div><div class="fld"><label for="st">עד תאריך</label><input id="st" type="date" value="'+g+'"></div></div><div class="btns"><button class="bp" id="sOk">דיווח</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#sOk").onclick=async function(){var f=b.querySelector("#sf").value,t=b.querySelector("#st").value;if(!f||!t||t<f)return;closePop();
    try{await rpc("report_sick",{a:f,b:t});await refresh();toast("הדיווח נשלח. רפואה שלמה")}catch(e){toast(errMsg(e))}}}

/* ---------- manager ---------- */
function empDialog(id){var e=emp(id);var b=pop('<h3>'+e.name+'</h3><p class="sub">פרטים שמשפיעים על הימים המיוחדים ועל החופשות</p><div class="form"><div class="fld"><label for="es">תחילת עבודה</label><input id="es" type="date" value="'+(e.start||"")+'"></div><div class="fld"><label for="eb">יום הולדת</label><input id="eb" type="date" value="'+(e.birthday||"")+'"></div><div class="fld"><label for="ev">ימי חופשה בשנה</label><input id="ev" type="number" min="0" max="40" value="'+e.vac+'"></div></div>'+
  '<p class="lbl2">כניסה לאתר</p><p class="sub" id="codeLine">'+(e.code?'קוד הצטרפות: <b class="ltr" style="font-size:18px;letter-spacing:.12em">'+e.code+"</b>":"כבר מחובר. אם שכח את הקוד האישי, צור קוד הצטרפות חדש.")+'</p><button class="btn ghost" type="button" id="eCode" style="width:100%">קוד הצטרפות חדש</button>'+
  '<div class="btns"><button class="bp" id="eOk">שמירה</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;
  b.querySelector("#eCode").onclick=async function(){try{var c=await rpc("new_invite",{eid:id});e.code=c;b.querySelector("#codeLine").innerHTML='קוד הצטרפות: <b class="ltr" style="font-size:18px;letter-spacing:.12em">'+c+"</b>"}catch(x){toast(errMsg(x))}};
  b.querySelector("#eOk").onclick=async function(){var u={start_date:b.querySelector("#es").value||null,birthday:b.querySelector("#eb").value||null,vac_per_year:+b.querySelector("#ev").value||0};closePop();
    var r=await sb.from("employees").update(u).eq("id",id);if(r.error){toast(errMsg(r.error));return}await refresh();toast("נשמר")}}
async function decide(id,ok){try{await rpc("decide",{rid:id,ok:ok});await refresh();toast(ok?"אושר":"נדחה",async function(){try{await rpc("undo_decision",{rid:id});await refresh()}catch(e){toast(errMsg(e))}})}catch(e){await refresh();toast(errMsg(e))}}
function exportCsv(){var y=repMonth[0],m=repMonth[1],pre=y+"-"+pad(m+1),rows=[["עובד","תאריך","יום","כניסה","יציאה","שעות","מיקום","הערה"]];
  D.emps.forEach(function(e){D.punches.filter(function(p){return p.emp===e.id&&p.date.slice(0,7)===pre&&p.out}).sort(function(a,b){return a.date<b.date?-1:1}).forEach(function(p){rows.push([e.name,p.date,HEB_DAYS[parse(p.date).getDay()],p.in,p.out,dur(mins(p.out)-mins(p.in)),(p.inLoc==="out"||p.outLoc==="out")?"מחוץ למשרד":"משרד",p.note||""])});
    D.reqs.filter(function(r){return r.emp===e.id&&(r.type==="vac"&&r.status==="ok"||r.type==="sick")&&r.from.slice(0,7)===pre}).forEach(function(r){rows.push([e.name,r.from+(r.to!==r.from?" עד "+r.to:""),"",r.type==="vac"?"חופשה":"מחלה","",r.days+" ימים","",""])})});
  var csv="﻿"+rows.map(function(r){return r.map(function(c){c=String(c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(",")}).join("\n");
  var name="נוכחות-קינסט-"+pre+".csv",blob=new Blob([csv],{type:"text/csv"});
  try{var f=new File([blob],name,{type:"text/csv"});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(){});return}}catch(e){}
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}

/* managers clock in too: their tabs are today · team · approvals · report */
function tabOrder(){return isMgr()?["today","team","approve","report"]:["today","week","vac"]}
function navHtml(){var L={today:["היום","i-clock"],week:["השבוע","i-list"],vac:["חופשות","i-sun"],team:["צוות","i-team"],approve:["לאישור","i-check"],report:["דוח","i-chart"]};
  var pend=D.reqs.filter(function(r){return r.status==="pending"}).length;
  return tabOrder().map(function(k){return '<button type="button" data-tab="'+k+'" aria-selected="'+(tab===k)+'"><svg><use href="#'+L[k][1]+'"/></svg>'+L[k][0]+(k==="approve"&&pend?'<span class="cnt">'+pend+"</span>":"")+"</button>"}).join("")}

/* ---------- account menu (top chip) ---------- */
function isStandalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
var TL={today:["היום","i-clock"],week:["השבוע","i-list"],vac:["חופשות","i-sun"],team:["צוות","i-team"],approve:["לאישור","i-check"],report:["דוח חודשי","i-chart"]};
function pendingCount(){return isMgr()?D.reqs.filter(function(r){return r.status==="pending"}).length:0}
function accountDialog(){var m=emp(me()),pend=pendingCount();
  var codes=isMgr()?D.all.filter(function(e){return e.code}).map(function(e){return '<div class="drow"><span>'+e.name+'</span><span class="nn"></span><span class="tt ltr" style="letter-spacing:.1em">'+e.code+"</span></div>"}).join(""):"";
  var off=D.office||{};
  var b=pop('<h3>'+esc(m?m.name:"")+'</h3><p class="sub">'+(isMgr()?"מנהל":"עובד")+" · קינסט</p>"+
    '<div class="mlist">'+tabOrder().map(function(k){return '<button type="button" data-go="'+k+'" aria-current="'+(tab===k)+'"><svg><use href="#'+TL[k][1]+'"/></svg>'+TL[k][0]+(k==="approve"&&pend?'<span class="cnt2">'+pend+"</span>":"")+"</button>"}).join("")+"</div>"+
    (isStandalone()?"":'<p class="lbl2">להוספה למסך הבית</p><p class="sub">באייפון: לחיצה על כפתור השיתוף בספארי ואז על "הוספה למסך הבית". מעכשיו השעון ייפתח כמו אפליקציה.</p>')+
    (isMgr()?'<p class="lbl2">מיקום המשרד</p><p class="sub">'+esc(off.address||"")+(off.lat?" · נקבע":" · עוד לא נקבע")+'</p><button class="btn ghost" type="button" id="aHere" style="width:100%">אני במשרד עכשיו, קבע את המיקום מכאן</button>'+
      (codes?'<p class="lbl2" style="margin-top:12px">קודי הצטרפות למי שעוד לא נכנס</p>'+codes:""):"")+
    '<div class="mlist" style="margin-top:12px"><button type="button" class="red" id="aOut"><svg><use href="#i-out"/></svg>התנתקות</button></div>'+
    '<div class="btns"><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;
  b.querySelectorAll("[data-go]").forEach(function(x){x.onclick=function(){var k=x.dataset.go;closePop();if(k===tab)return;var o=tabOrder(),a=o.indexOf(tab),c=o.indexOf(k);tab=k;render(c>a?"a-tl":"a-tr")}});
  b.querySelector("#aOut").onclick=async function(){closePop();await sb.auth.signOut();location.reload()};
  var h=b.querySelector("#aHere");if(h)h.onclick=async function(){h.textContent="רגע…";var p=await getPos();if(!p){h.textContent="לא הצלחתי לקבל מיקום. צריך לאשר גישה למיקום";return}
    D.office=Object.assign({},D.office,{lat:p.lat,lng:p.lng});var r=await sb.from("settings").update({value:D.office}).eq("key","office");closePop();toast(r.error?errMsg(r.error):"מיקום המשרד נשמר")}}

/* the phone's top strip follows the page color (plain, morning tint, evening dusk) */
var BAR={light:{"":"#E6E9EC",in:"#C2E0EB",out:"#A1ADB8"},dark:{"":"#2F2F2F",in:"#274953",out:"#1A1E25"}};
function isDark(){var t=document.documentElement.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
var veilNow="";
function setVeil(c){veilNow=c||"";var el=$("#veil");el.className="veil"+(c?" "+c:"");var m=$("#tcolor");if(m)m.setAttribute("content",BAR[isDark()?"dark":"light"][veilNow])}
var _render=render;render=function(dir){_render(dir);var d=$("#mdot");if(d)d.hidden=!pendingCount()};

/* ---------- login ---------- */
async function loginView(){FX.stop();setVeil("");$("#tabs").innerHTML="";$("#tabs").style.display="none";$("#demoBtn").style.visibility="hidden";
  var v=$("#view");v.innerHTML='<section class="login"><p class="q">שעון הנוכחות של קינסט</p><p class="sub">מי נכנס?</p><div class="names" id="names"><p class="sub">טוען…</p></div></section>';
  var r=await sb.rpc("login_names");if(r.error){$("#names").innerHTML='<p class="sub">אין חיבור. נסה לרענן.</p>';return}
  $("#names").innerHTML=r.data.map(function(x){return '<button type="button" class="nm" data-id="'+x.id+'"><span class="av">'+esc(x.name[0])+"</span>"+esc(x.name)+"</button>"}).join("");
  v.querySelectorAll(".nm").forEach(function(btn){btn.onclick=function(){var x=r.data.find(function(y){return y.id===btn.dataset.id});loginForm(x)}})}
function loginForm(x){var reg=x.registered;
  var b=pop('<h3>'+esc(x.name)+'</h3><p class="sub">'+(reg?"הקוד האישי שלך":"פעם ראשונה? הקלד את קוד ההצטרפות שקיבלת, ובחר קוד אישי משלך")+'</p><form id="lf" class="form" autocomplete="on"><input type="email" name="username" autocomplete="username" value="'+esc(x.email)+'" hidden>'+
    (reg?"":'<div class="fld"><label for="jc">קוד הצטרפות</label><input id="jc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 ספרות"></div>')+
    '<div class="fld"><label for="pw">'+(reg?"קוד אישי":"קוד אישי חדש")+'</label><input id="pw" type="password" inputmode="numeric" autocomplete="'+(reg?"current-password":"new-password")+'" placeholder="לפחות 6 ספרות"></div></form><p id="lerr" class="warn"></p>'+
    '<div class="btns"><button class="bp" id="lgo">כניסה</button>'+(reg?'<button class="bs" id="lforgot" type="button">שכחתי</button>':'<button class="bs">ביטול</button>')+'</div>');
  var err=b.querySelector("#lerr");
  b.querySelectorAll(".bs").forEach(function(s){s.onclick=function(){if(s.id==="lforgot"){err.textContent="בקש מרן או מצפריר קוד הצטרפות חדש, ואז תבחר קוד אישי חדש.";x.registered=false;setTimeout(function(){closePop();loginForm(x)},1800);return}closePop()}});
  async function go(){var pw=b.querySelector("#pw").value;err.textContent="";if(pw.length<6){err.textContent="הקוד האישי צריך להיות לפחות 6 ספרות";return}
    b.querySelector("#lgo").textContent="רגע…";
    try{if(!x.registered){var jc=b.querySelector("#jc").value.trim();
        var res=await fetch(SB_URL+"/functions/v1/register",{method:"POST",headers:{"Content-Type":"application/json",apikey:SB_KEY,Authorization:"Bearer "+SB_KEY},body:JSON.stringify({emp:x.id,code:jc,password:pw})});
        var j=await res.json();if(!res.ok){err.textContent=j.error==="wrong_code"||j.error==="bad_code"?"קוד ההצטרפות לא נכון":"משהו השתבש. נסה שוב";b.querySelector("#lgo").textContent="כניסה";return}}
      var s=await sb.auth.signInWithPassword({email:x.email,password:pw});
      if(s.error){err.textContent="הקוד האישי לא נכון";b.querySelector("#lgo").textContent="כניסה";return}
      closePop();start()}catch(e){err.textContent=errMsg(e);b.querySelector("#lgo").textContent="כניסה"}}
  b.querySelector("#lgo").onclick=go;b.querySelector("#lf").onsubmit=function(e){e.preventDefault();go()};
  setTimeout(function(){var f=b.querySelector(x.registered?"#pw":"#jc");if(f)f.focus()},350)}

/* ---------- boot ---------- */
var started=false;
async function refresh(){try{await loadAll()}catch(e){toast(errMsg(e))}render()}
async function start(){var s=await sb.auth.getSession();if(!s.data.session){loginView();return}
  try{await loadAll()}catch(e){if(/JWT|jwt|401/.test(e.message||"")){await sb.auth.signOut();loginView();return}$("#view").innerHTML='<p class="empty">אין חיבור כרגע. נסה לרענן.</p>';return}
  if(!D.meId){$("#view").innerHTML='<p class="empty">המשתמש הזה לא מוגדר בשעון.</p>';return}
  D.dayNote="";$("#tabs").style.display="";$("#demoBtn").style.visibility="visible";$("#demoWho").textContent=emp(me()).name;
  await loadWeather();tab="today";started=true;render("a-load");geocodeOffice()}
document.addEventListener("click",function(e){var t=e.target.closest("[data-tab]");if(t){var order=tabOrder(),a=order.indexOf(tab),b=order.indexOf(t.dataset.tab);if(t.dataset.tab===tab)return;tab=t.dataset.tab;render(b>a?"a-tl":"a-tr");return}
  var ok=e.target.closest("[data-ok]");if(ok){decide(ok.dataset.ok,true);return}var no=e.target.closest("[data-no]");if(no){decide(no.dataset.no,false);return}
  var ex=e.target.closest("[data-exp]");if(ex){var box=$("#x"+ex.dataset.exp);box.hidden=!box.hidden;ex.textContent=box.hidden?"פירוט לפי ימים":"הסתרת הפירוט";return}
  if(e.target.closest("#mPrev")){repMonth[1]--;if(repMonth[1]<0){repMonth[1]=11;repMonth[0]--}render("a-tr");return}
  if(e.target.closest("#mNext")){repMonth[1]++;if(repMonth[1]>11){repMonth[1]=0;repMonth[0]++}render("a-tl");return}
  if(e.target.closest("#xls")){exportCsv();return}
  if(e.target.closest("#askVac")){vacDialog();return}if(e.target.closest("#askSick")){sickDialog();return}
  var er=e.target.closest("[data-emp]");if(er){empDialog(er.dataset.emp);return}
  var dr=e.target.closest("[data-date]");if(dr&&!isMgr()){fixDialog(me(),dr.dataset.date);return}
});
$("#demoBtn").onclick=accountDialog;
$("#themeBtn").onclick=function(){var r=document.documentElement,t=r.getAttribute("data-theme"),dark=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;var nt=dark?"light":"dark";r.setAttribute("data-theme",nt);ls("keenest.theme",nt);setVeil(veilNow);if(started&&tab==="today")afterToday()};
(function(){var t=ls("keenest.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);setVeil("")})();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){setVeil(veilNow)});
var rzT;window.addEventListener("resize",function(){clearTimeout(rzT);rzT=setTimeout(function(){if(started&&tab==="today")FX.resize()},250)});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&started)refresh()});
setInterval(function(){if(started&&document.visibilityState==="visible"&&isMgr())refresh()},60000);
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(function(){});
start();
