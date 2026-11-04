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
  D.punches=res[1].data.filter(function(p){return p.in_time}).map(function(p){return {id:p.id,emp:p.emp,date:p.day,in:t5(p.in_time),out:t5(p.out_time),inLoc:p.in_loc||"",outLoc:p.out_loc||"",note:p.note||"",pending:p.pending}});
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
  navigator.geolocation.getCurrentPosition(function(p){res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy})},function(){res(null)},{enableHighAccuracy:false,timeout:5000,maximumAge:120000})})}
function distM(a,b){var R=6371000,t=Math.PI/180,dLat=(b.lat-a.lat)*t,dLng=(b.lng-a.lng)*t,x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dLng/2)*Math.sin(dLng/2);return 2*R*Math.asin(Math.sqrt(x))}
function whereIs(pos){var o=D.office;if(!pos||!o||!o.lat)return "unknown";return distM(pos,o)<=(o.radius||200)+Math.min(pos.acc||0,150)?"office":"out"}
async function geocodeOffice(){if(!isMgr()||!D.office||D.office.lat||!D.office.address)return;
  try{var r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&q="+encodeURIComponent(D.office.address));var j=await r.json();
    if(j&&j[0]){D.office.lat=+j[0].lat;D.office.lng=+j[0].lon;await sb.from("settings").update({value:D.office}).eq("key","office")}}catch(e){}}

/* ---------- today: real actions ---------- */
var busy=false;
async function act(){if(busy)return;var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);if(p&&p.out)return;busy=true;
  var pos=await (window.__posP||getPos()),loc=whereIs(pos);window.__posP=null;busy=false;
  if(isMgr()){if(!p)clockIn(loc,pos);else clockOut(loc,pos,null);return} /* Ran and Tzafrir often work from home: no outside-office warnings for them */
  if(!p){if(loc==="out"){var b=pop('<h3>אתה לא במשרד</h3><p>בטוח שאתה רוצה לעשות כניסה מכאן?</p><div class="btns"><button class="bp" id="goIn">כניסה בכל זאת</button><button class="bs">ביטול</button></div>');
      b.querySelector("#goIn").onclick=function(){closePop();clockIn(loc,pos)};b.querySelector(".bs").onclick=function(){closePop();render()};return}clockIn(loc,pos);return}
  if(loc==="out"){outAway(p,pos);return}clockOut(loc,pos,null)}
/* ---------- notifications ---------- */
function pushReady(){return "serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window}
function b64u(s){var p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/")),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
async function pushSubscribe(ask){if(!pushReady())return "unsupported";
  var perm=Notification.permission;if(perm==="default"&&ask)perm=await Notification.requestPermission();if(perm!=="granted")return perm;
  var reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
  if(!sub){var key=D.settings&&D.settings.vapid_public;if(!key)return "error";sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(key)})}
  await rpc("save_push",{sub:sub.toJSON()});return "on"}
function pushState(){if(!pushReady())return isStandalone()?"לא נתמך":"אחרי הוספה למסך הבית";var p=Notification.permission;return p==="granted"?"פעילות":p==="denied"?"חסומות בהגדרות":"כבויות"}
function askPushOnce(){if(!pushReady()||!isStandalone()||Notification.permission!=="default"||ls("kc-push-asked"))return;ls("kc-push-asked","1");
  setTimeout(function(){var b=pop('<h3>להפעיל התראות?</h3><p>'+(isMgr()?"תקבל תזכורת אם שכחת להיכנס או לצאת, והתראה כשמישהו מהצוות נכנס או יוצא מחוץ למשרד.":"תקבל תזכורת אם שכחת להיכנס או לצאת.")+'</p><div class="btns"><button class="bp" id="pOn">הפעלה</button><button class="bs">ביטול</button></div>');
    b.querySelector(".bs").onclick=closePop;b.querySelector("#pOn").onclick=async function(){closePop();var r=await pushSubscribe(true).catch(function(){return "error"});if(r==="on")toast("ההתראות פעילות");else if(r==="denied")toast("ההתראות חסומות. אפשר להפעיל בהגדרות של האייפון")}},900)}

/* clock-in moment, in the spirit of iPhone NameDrop: a colour glow wraps the screen edges and a soft light wave
   rises from the slider; everything it passes swells for an instant */
function nameDrop(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var g=document.createElement("div");g.className="nd-glow";var w=document.createElement("div");w.className="nd-wave";document.body.appendChild(g);document.body.appendChild(w);
  setTimeout(function(){g.remove();w.remove()},1900);
  var H=innerHeight;document.querySelectorAll("header.top .hlogo,header.top .rb,.mock .hi,.mock .q,.mock .l,.mock .where").forEach(function(el){var r=el.getBoundingClientRect(),d=Math.max(0,(H-(r.top+r.height/2))/H)*0.75;
    el.style.animation="none";void el.offsetWidth;el.style.animation="ndpop .7s cubic-bezier(.32,.72,0,1) "+d.toFixed(2)+"s both";setTimeout(function(){el.style.animation=""},(d+.8)*1000)})}

/* clock in/out never rebuilds the screen: only the parts that change are swapped in place */
function patchToday(){var om=document.querySelector("#view .mock");if(tab!=="today"||!om){render();return}
  var tmp=document.createElement("div");tmp.innerHTML=viewToday();var nm=tmp.querySelector(".mock");
  om.className=nm.className;
  [".t",".slide"].forEach(function(s){var a=om.querySelector(s),b=nm.querySelector(s);if(a&&b)a.replaceWith(b)});
  var oq=om.querySelector(".q"),nq=nm.querySelector(".q");if(oq&&nq){if(oq.textContent!==nq.textContent)oq.textContent=nq.textContent;oq.className=nq.className}
  var ow=om.querySelector(".where"),nw=nm.querySelector(".where");if(ow&&nw&&ow.outerHTML!==nw.outerHTML)ow.replaceWith(nw);
  var of=om.querySelector(".locflag");if(of)of.remove();var nf=nm.querySelector(".locflag");if(nf)om.querySelector(".where").after(nf);
  afterToday()}

/* optimistic: the screen updates at once, the server confirms in the background */
async function clockIn(loc,pos){var e=emp(me()),g=iso(new Date()),t=hm(new Date()),tmp={id:"tmp",emp:e.id,date:g,in:t,out:null,inLoc:loc,outLoc:"",note:D.dayNote||"",pending:false};
  D.punches.push(tmp);window.__rise=1;window.__wash=1;patchToday();nameDrop();
  try{var r=await rpc("clock_in",{loc:loc,lat:pos&&pos.lat,lng:pos&&pos.lng});tmp.id=r.id;var st=t5(r.in_time);if(st!==tmp.in){tmp.in=st;var el=document.querySelector(".mock .t");if(el)el.textContent=st}}
  catch(x){D.punches=D.punches.filter(function(p){return p!==tmp});render();toast(errMsg(x))}}
async function clockOut(loc,pos,earlier){var e=emp(me()),p=punchOf(e.id,iso(new Date())),t=earlier||hm(new Date());if(p){p.out=t;p.outLoc=loc;if(earlier)p.pending=true}
  window.__rise=1;window.__wash=1;patchToday();if(earlier)toast("שעת היציאה נשלחה לאישור");
  try{var r=await rpc("clock_out",{loc:loc,lat:pos&&pos.lat,lng:pos&&pos.lng,earlier:earlier});if(p&&!earlier){var st=t5(r.out_time);if(st!==p.out){p.out=st;var el2=document.querySelector(".mock .t");if(el2)el2.innerHTML=p.in+'<span class="dash"> – </span>'+st}}if(earlier)refresh()}
  catch(x){if(p){p.out=null;p.pending=false}render();toast(errMsg(x))}}
function outAway(p,pos){var b=pop('<h3>אתה לא במשרד</h3><p class="sub">מתי יצאת?</p><div class="seg" id="whenSeg"><button type="button" aria-pressed="true" data-w="now">עכשיו</button><button type="button" aria-pressed="false" data-w="before">קודם</button></div><div class="form" id="tBox" hidden><div class="fld"><label for="outT">שעת יציאה</label><input id="outT" type="time" value="'+hm(new Date())+'"></div></div><p id="tNote" hidden>שעה מוקדמת נשלחת לאישור של רן או צפריר.</p><div class="btns"><button class="bp" id="okOut">יציאה</button><button class="bs">ביטול</button></div>');
  var w="now";b.querySelectorAll("#whenSeg button").forEach(function(x){x.onclick=function(){w=x.dataset.w;b.querySelectorAll("#whenSeg button").forEach(function(y){y.setAttribute("aria-pressed",y===x)});b.querySelector("#tBox").hidden=w!=="before";b.querySelector("#tNote").hidden=w!=="before";b.querySelector("#okOut").textContent=w==="before"?"שליחה לאישור":"יציאה"}});
  b.querySelector(".bs").onclick=function(){closePop();render()};
  b.querySelector("#okOut").onclick=function(){if(w==="now"){closePop();clockOut("out",pos,null);return}var t=b.querySelector("#outT").value;if(!t)return;closePop();clockOut("out",pos,t)}}
function forgotOut(p){var b=pop('<h3>שכחת לצאת</h3><p class="sub">'+HEB_DAYS[parse(p.date).getDay()]+", "+nice(p.date)+'</p><p>נכנסת ב־'+p.in+' ולא נרשמה יציאה. מתי יצאת?</p><div class="form"><div class="fld"><label for="fo">שעת יציאה</label><input id="fo" type="time" value="18:00"></div></div><div class="btns"><button class="bp" id="foOk">שליחה לאישור</button><button class="bs">אחר כך</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#foOk").onclick=async function(){var t=b.querySelector("#fo").value;if(!t)return;closePop();try{await rpc("forgot_out",{p_day:p.date,t:t});await refresh();toast("נשלח לאישור של רן וצפריר")}catch(e){toast(errMsg(e))}}}
var forgotAsked={};
function afterToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);
  var keep=window.__fxOn&&window.__fxDay===g&&window.__fxWho===e.id;
  if(p){setVeil(p.out?"out":"in");if(!keep){playLook(todayLook());window.__fxOn=1;window.__fxDay=g;window.__fxWho=e.id}}else{FX.stop();window.__fxOn=0;setVeil("")}
  $("#whereBtn").onclick=whereDialog;bindSlide();if(!(p&&p.out)&&!window.__posP)window.__posP=getPos();
  var open=D.punches.find(function(q){return q.emp===e.id&&!q.out&&q.date<g});
  if(open&&!forgotAsked[open.date]&&!D.reqs.some(function(r){return r.type==="fix"&&r.emp===e.id&&r.date===open.date&&r.status==="pending"})){forgotAsked[open.date]=1;setTimeout(function(){forgotOut(open)},700)}}
function viewToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g),look=todayLook(),vacToday=onVac(e.id,g,"ok");
  var st=!p?"before":p.out?"done":"in";
  var tHtml=st==="before"?'<span class="t wait2">'+(vacToday?"היום אתה בחופשה":"עוד לא נכנסת")+"</span>":st==="in"?'<span class="t'+(window.__rise?" rise":"")+'">'+p.in+"</span>":'<span class="t pair'+(window.__rise?" rise":"")+'">'+p.in+'<span class="dash"> – </span>'+p.out+"</span>";
  var note=(p&&p.note)||D.dayNote||"";
  var flag=p&&p.inLoc==="out"&&!note?'<span class="locflag">נכנסת מחוץ למשרד</span>':"";
  var sad=look.fx&&look.fx[0]==="נר תשעה באב",hi=sad?e.name:partOfDay()+", "+e.name;
  var rise=window.__rise?" rise":"";
  if(window.__rise)tHtml=tHtml.replace(/>([0-9:]{4,5})</g,function(m,t){return ">"+t.split("").map(function(ch,i){return '<span class="dg" style="--i:'+i+'">'+ch+"</span>"}).join("")+"<"}).replace(/>([0-9:]{4,5})(<span class="dash">)/,function(m,t,rest){return ">"+t.split("").map(function(ch,i){return '<span class="dg" style="--i:'+i+'">'+ch+"</span>"}).join("")+rest});
  return '<section class="mock'+(window.__rise?" enter":"")+'"><span class="hi">'+esc(hi)+'</span><p class="q'+(st==="before"?" hide":(window.__rise&&st==="in"||!window.__rise&&!window.__fxOn?" rise":""))+'">'+esc(look.q)+'</p><span class="sp big"></span>'+
    '<span class="l">יום '+HEB_DAYS[new Date().getDay()]+", "+nice(g)+"</span>"+tHtml+'<button type="button" class="where'+(note?" on":"")+'" id="whereBtn"><svg><use href="#i-pin"/></svg><span>'+(note?esc(note):"מחוץ למשרד היום?")+"</span></button>"+flag+
    '<span class="sp"></span><div class="slide'+(st==="in"?" exit":"")+(st==="done"?" done":"")+'" id="slide"><span class="knob" id="knob"><svg><use href="#i-arrow"/></svg></span><span class="lbl" id="slbl">'+(st==="before"?"החלק לכניסה":st==="in"?"החלק ליציאה":"יום טוב, נתראה מחר")+"</span></div></section>"}
function whereDialog(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);var cur=(p&&p.note)||D.dayNote||"";
  var b=pop('<h3>מחוץ למשרד היום?</h3><p class="sub">אפשר לכתוב איפה אתה, למשל צילומים</p><div class="chips">'+["צילומים","פגישה אצל לקוח","עבודה מהבית"].map(function(c){return '<button type="button">'+c+"</button>"}).join("")+'</div><textarea class="note" id="wn" placeholder="צילומים בנמל תל אביב">'+esc(cur)+'</textarea><div class="btns"><button class="bp" id="wOk">שמירה</button>'+(cur?'<button class="bred" id="wDel">בעצם אני במשרד</button>':"")+'<button class="bs">ביטול</button></div>');
  b.querySelectorAll(".chips button").forEach(function(c){c.onclick=function(){var ta=b.querySelector("#wn");ta.value=c.textContent+" ";ta.focus()}});
  b.querySelector(".bs").onclick=closePop;
  async function set(v){closePop();try{await rpc("set_day_note",{n:v});D.dayNote=v;await refresh()}catch(e){toast(errMsg(e))}}
  b.querySelector("#wOk").onclick=function(){set(b.querySelector("#wn").value.trim())};var dl=b.querySelector("#wDel");if(dl)dl.onclick=function(){set("")}}
function todayLook(){return dayLook(new Date(),emp(me()),null)}

/* greeting by the hour: morning 5–12, noon 12–17, evening 17–21, night after that */
function partOfDay(){var h=new Date().getHours();return h>=5&&h<12?"בוקר טוב":h>=12&&h<17?"צהריים טובים":h>=17&&h<21?"ערב טוב":"לילה טוב"}

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
var APP_VERSION=11;
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
    (isMgr()?'<div class="mlist" style="margin-top:12px"><button type="button" id="aReset"><svg><use href="#i-clock"/></svg>איפוס הכניסה והיציאה שלי היום</button></div>':"")+
    '<div class="mlist" style="margin-top:12px"><button type="button" class="red" id="aOut"><svg><use href="#i-out"/></svg>התנתקות</button></div>'+
    '<p class="sub" id="aVer" style="text-align:center;margin-top:10px">גרסה '+APP_VERSION+'</p><div class="btns"><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;
  b.querySelector("#aVer").onclick=function(){var t=document.createElement("div");t.style.cssText="position:fixed;left:0;right:0;top:0;bottom:0;pointer-events:none";document.body.appendChild(t);
    var s=getComputedStyle(document.documentElement),pr=document.createElement("div");pr.style.cssText="position:fixed;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";document.body.appendChild(pr);var ps=getComputedStyle(pr);
    this.textContent="גרסה "+APP_VERSION+" · מסך "+screen.width+"×"+screen.height+" · חלון "+innerWidth+"×"+innerHeight+" · vv "+Math.round(visualViewport?visualViewport.height:0)+" · html "+document.documentElement.clientHeight+" · fixed "+Math.round(t.getBoundingClientRect().height)+" · top "+ps.paddingTop+" · bottom "+ps.paddingBottom+" · "+(isStandalone()?"app":"safari");t.remove();pr.remove()};
  b.querySelectorAll("[data-go]").forEach(function(x){x.onclick=function(){var k=x.dataset.go;closePop();if(k===tab)return;var o=tabOrder(),a=o.indexOf(tab),c=o.indexOf(k);tab=k;render(c>a?"a-tl":"a-tr")}});
  b.querySelector("#aOut").onclick=async function(){closePop();await sb.auth.signOut();location.reload()};
  var rs=b.querySelector("#aReset");if(rs)rs.onclick=async function(){closePop();try{await rpc("reset_my_day");D.dayNote="";FX.stop();tab="today";await refresh();toast("היום שלך אופס. אפשר להיכנס שוב")}catch(e){toast(errMsg(e))}};
  var h=b.querySelector("#aHere");if(h)h.onclick=async function(){h.textContent="רגע…";var p=await getPos();if(!p){h.textContent="לא הצלחתי לקבל מיקום. צריך לאשר גישה למיקום";return}
    D.office=Object.assign({},D.office,{lat:p.lat,lng:p.lng});var r=await sb.from("settings").update({value:D.office}).eq("key","office");closePop();toast(r.error?errMsg(r.error):"מיקום המשרד נשמר")}}

/* the phone's top strip follows the page color (plain, morning tint, evening dusk) */
var BAR={light:{"":"#E6E9EC",in:"#C2E0EB",out:"#A1ADB8"},dark:{"":"#2F2F2F",in:"#274953",out:"#1A1E25"}};
var FOOT={light:{"":"#E6E9EC",in:"#C2E0EB",out:"#E9DDD8"},dark:{"":"#2F2F2F",in:"#274953",out:"#4C3D35"}};
function isDark(){var t=document.documentElement.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
var veilNow="";
function setVeil(c){var was=veilNow;veilNow=c||"";var el=$("#veil");el.className="veil"+(c?" "+c:"")+(c&&!was&&window.__wash?" wash":"");window.__wash=0;var k=isDark()?"dark":"light",m=$("#tcolor");if(m)m.setAttribute("content",BAR[k][veilNow]);document.documentElement.style.backgroundColor=FOOT[k][veilNow]}
var _render=render;render=function(dir){if(tab!=="today")window.__fxOn=0;_render(dir);var d=$("#mdot");if(d)d.hidden=!pendingCount()};

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
  await loadWeather();tab="today";started=true;render("a-load");geocodeOffice();if(pushReady()&&Notification.permission==="granted")pushSubscribe(false).catch(function(){});else askPushOnce()}
document.addEventListener("click",function(e){var t=e.target.closest("[data-tab]");if(t){var order=tabOrder(),a=order.indexOf(tab),b=order.indexOf(t.dataset.tab);if(t.dataset.tab===tab)return;tab=t.dataset.tab;render(b>a?"a-tl":"a-tr");return}
  var ok=e.target.closest("[data-ok]");if(ok){decide(ok.dataset.ok,true);return}var no=e.target.closest("[data-no]");if(no){decide(no.dataset.no,false);return}
  var ex=e.target.closest("[data-exp]");if(ex){var box=$("#x"+ex.dataset.exp);box.hidden=!box.hidden;if(ex.classList.contains("exp"))ex.textContent=box.hidden?"פירוט לפי ימים":"הסתרת הפירוט";return}
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

/* ================= chosen designs: full-screen menu · weekly team board · request cards ================= */
APP_VERSION=11;
function accountDialog(){var m=emp(me()),pend=pendingCount(),off=D.office||{},codes=isMgr()?D.all.filter(function(e){return e.code}):[];
  var old=$("#fullmenu");if(old)old.remove();
  var el=document.createElement("div");el.id="fullmenu";el.className="fm";el.setAttribute("role","dialog");el.setAttribute("aria-label","תפריט");
  el.innerHTML='<div class="fm-in"><div class="fm-top"><button class="rb" type="button" id="fmClose" aria-label="סגירה"><svg><use href="#i-x"/></svg></button><img class="hlogo" src="'+$(".hlogo").src+'" alt="Keenest"><span style="width:44px"></span></div>'+
    '<nav class="fm-big">'+tabOrder().map(function(k){return '<button type="button" data-go="'+k+'"'+(tab===k?' class="on"':"")+'>'+TL[k][0]+(k==="approve"&&pend?'<span class="cnt2">'+pend+"</span>":"")+"</button>"}).join("")+"</nav>"+
    '<div class="fm-small">'+
      (isStandalone()?"":'<div class="fm-note">להוספה למסך הבית: בספארי, כפתור השיתוף ואז "הוספה למסך הבית".</div>')+
      (isMgr()?'<button type="button" id="aHere"><span>מיקום המשרד</span><span>'+(off.lat?"נקבע":"עוד לא נקבע")+'</span></button>'+
        '<button type="button" id="aCodes"><span>קודי הצטרפות</span><span>'+(codes.length?codes.length+" ממתינים":"כולם נכנסו")+'</span></button>'+
        '<button type="button" id="aReset"><span>איפוס היום שלי</span><span>לבדיקות</span></button>':"")+
      '<button type="button" id="aPush"><span>התראות</span><span>'+pushState()+'</span></button>'+
      '<button type="button" id="aOut" class="r"><span>התנתקות</span><span>'+esc(m?m.name:"")+'</span></button>'+
      '<div class="fm-ver">גרסה '+APP_VERSION+'</div></div></div>';
  document.body.appendChild(el);requestAnimationFrame(function(){el.classList.add("show")});
  function close(){el.classList.remove("show");setTimeout(function(){el.remove()},320)}
  el.querySelector("#fmClose").onclick=close;
  el.querySelectorAll("[data-go]").forEach(function(x){x.onclick=function(){var k=x.dataset.go;close();if(k===tab)return;var o=tabOrder(),a=o.indexOf(tab),c=o.indexOf(k);tab=k;render(c>a?"a-tl":"a-tr")}});
  el.querySelector("#aOut").onclick=async function(){close();await sb.auth.signOut();location.reload()};
  var ap=el.querySelector("#aPush");if(ap)ap.onclick=async function(){var s=ap.lastChild;if(!pushReady()){s.textContent=isStandalone()?"לא נתמך":"קודם הוספה למסך הבית";return}s.textContent="רגע…";var r=await pushSubscribe(true).catch(function(){return "error"});s.textContent=r==="on"?"פעילות":r==="denied"?"חסומות בהגדרות":r==="error"?"לא הצליח":"כבויות"};
  var rs=el.querySelector("#aReset");if(rs)rs.onclick=async function(){close();try{await rpc("reset_my_day");D.dayNote="";FX.stop();tab="today";await refresh();toast("היום שלך אופס. אפשר להיכנס שוב")}catch(e){toast(errMsg(e))}};
  var cd=el.querySelector("#aCodes");if(cd)cd.onclick=function(){var b=pop('<h3>קודי הצטרפות</h3><p class="sub">כל אחד לוחץ על השם שלו בשעון ומקליד את הקוד. אחרי שנכנס, הקוד נמחק.</p>'+(codes.length?codes.map(function(e){return '<div class="drow"><span>'+e.name+'</span><span class="nn"></span><span class="tt ltr" style="letter-spacing:.12em;font-size:17px">'+e.code+"</span></div>"}).join(""):'<p class="sub">כולם כבר נכנסו.</p>')+'<div class="btns"><button class="bs">סגירה</button></div>');b.querySelector(".bs").onclick=closePop};
  var h=el.querySelector("#aHere");if(h)h.onclick=async function(){var s=h.lastChild;s.textContent="רגע…";var p=await getPos();if(!p){s.textContent="אין גישה למיקום";return}
    D.office=Object.assign({},D.office,{lat:p.lat,lng:p.lng});var r=await sb.from("settings").update({value:D.office}).eq("key","office");s.textContent=r.error?"לא נשמר":"נקבע מכאן";toast(r.error?errMsg(r.error):"מיקום המשרד נשמר")}}

/* team: the whole week as one board */
var weekOff=0;
function cellOf(e,g){var p=punchOf(e.id,g),today=iso(new Date()),v=D.reqs.find(function(r){return r.emp===e.id&&(r.type==="vac"||r.type==="sick")&&r.status==="ok"&&r.from<=g&&r.to>=g});
  if(e.start&&g<e.start)return '<span class="c e"></span>';
  if(v)return '<span class="c v">'+(v.type==="sick"?"מחלה":"חופש")+"</span>";
  if(p){var away=p.inLoc==="out"||p.outLoc==="out";return '<span class="c'+(p.pending?" w":"")+(away?" o":"")+'"'+(away?' title="'+esc(p.note||"מחוץ למשרד")+'"':"")+'>'+p.in+"<br>"+(p.out||"·")+(away?'<i class="od"></i>':"")+"</span>"}
  return '<span class="c e">'+(g<today?"–":"")+"</span>"}
function viewTeam(){var s=addDays(sundayOf(new Date()),weekOff*7),today=iso(new Date()),days=[0,1,2,3,4].map(function(i){return addDays(s,i)});
  var lab=weekOff===0?"השבוע":weekOff===-1?"שבוע שעבר":"";var rng=days[0].getDate()+"–"+days[4].getDate()+" ב"+HEB_MONTHS[days[4].getMonth()];
  var inNow=D.emps.filter(function(e){var p=punchOf(e.id,today);return p&&!p.out}).length;
  return '<div class="tw"><div class="tw-h"><div><h1>צוות</h1><span class="sub">'+(lab?lab+" · ":"")+rng+'</span></div><div class="wnav"><button type="button" id="wPrev" aria-label="שבוע קודם"><svg><use href="#i-prev"/></svg></button><button type="button" id="wNext" aria-label="שבוע הבא"'+(weekOff>=0?" disabled":"")+'><svg><use href="#i-next"/></svg></button></div></div>'+
    (weekOff===0?'<p class="tw-now"><b>'+inNow+'</b> מתוך '+D.emps.length+" בעבודה עכשיו</p>":"")+
    '<div class="wgrid"><span></span>'+days.map(function(d){return '<span class="h'+(iso(d)===today?" t":"")+'">'+HEB_DAYS[d.getDay()].slice(0,1)+"׳ "+d.getDate()+"</span>"}).join("")+
    D.emps.map(function(e){return '<button type="button" class="wn" data-emp="'+e.id+'"><i class="pd '+e.cls+'"></i>'+esc(e.name)+"</button>"+days.map(function(d){var g=iso(d);return g===today?cellOf(e,g).replace('class="c','class="c t'):cellOf(e,g)}).join("")}).join("")+
    '</div><p class="tw-key"><i class="od"></i> מחוץ למשרד · לחיצה על שם פותחת את הפרטים שלו</p></div>'}

/* approvals: one card per request */
function viewApprove(){var pend=D.reqs.filter(function(r){return r.status==="pending"}).sort(function(a,b){return a.created<b.created?-1:1}),done=D.reqs.filter(function(r){return r.status!=="pending"&&r.type!=="sick"}).slice(-5).reverse();
  function card(r){var e=emp(r.emp),title,small,kind;
    if(r.type==="fix"){kind="תיקון שעות · "+HEB_DAYS[parse(r.date).getDay()]+", "+nice(r.date);title='<span class="ltr">'+(r.inT||"")+" – "+(r.outT||"")+"</span>";small=r.oldOut?"היה רשום "+(r.oldIn||"")+" – "+r.oldOut:(r.oldIn?"נכנס ב־"+r.oldIn+", בלי יציאה":"")}
    else{kind="בקשת חופשה";title=r.from===r.to?nice(r.from):nice(r.from)+" עד "+nice(r.to);small=r.days+" ימי עבודה · נשארו "+(e.vac-vacUsed(e.id))}
    return '<article class="rq-card"><div class="rq-who"><i class="pd '+e.cls+'"></i><div><b>'+esc(e.name)+"</b><small>"+kind+"</small></div>"+(r.late?'<span class="badge wait">מאוחר</span>':"")+'</div>'+
      '<div class="rq-what">'+title+(small?"<small>"+esc(small)+"</small>":"")+(r.note?'<small class="q">"'+esc(r.note)+'"</small>':"")+'</div>'+
      '<div class="rq-btns"><button type="button" class="bs2" data-no="'+r.id+'">לא עכשיו</button><button type="button" class="bp2" data-ok="'+r.id+'">אישור</button></div></article>'}
  return '<div class="ap"><h1>לאישור</h1><span class="sub">'+(pend.length?(pend.length===1?"בקשה אחת מחכה":pend.length+" בקשות מחכות"):"הכול טופל")+"</span>"+
    (pend.length?pend.map(card).join(""):'<p class="ap-empty">כשעדי, שלו או צפריר יבקשו חופשה או תיקון שעות, זה יופיע כאן.</p>')+
    (done.length?'<p class="hd">טופלו לאחרונה</p><div class="ap-done">'+done.map(function(r){var e=emp(r.emp);return '<div class="ap-row"><span>'+esc(e.name)+" · "+reqLabel(r)+"</span>"+statusBadge(r)+"</div>"}).join("")+"</div>":"")+"</div>"}

document.addEventListener("click",function(e){if(e.target.closest("#wPrev")){weekOff--;render("a-tr")}else if(e.target.closest("#wNext")&&weekOff<0){weekOff++;render("a-tl")}});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){var f=$("#fullmenu");if(f){f.classList.remove("show");setTimeout(function(){f.remove()},320)}}});

/* report: hours bars against the month's target (Sun–Thu, minus holidays, 9 hours a day) */
var DAY_H=9;
function closedDay(d){var h=heb(d),m=h.m,x=h.d;
  return (m==="Tishri"&&(x===1||x===2||x===10||x===15||x===22))||(m==="Nisan"&&(x===15||x===21))||(m==="Sivan"&&x===6)||(m==="Iyar"&&x===5)}
function targetDays(e,y,m,upto){var n=0,d=new Date(y,m,1,12),end=new Date(y,m+1,0,12);if(upto&&upto<end)end=upto;
  while(d<=end){var g=iso(d);if(isWork(d)&&!closedDay(d)&&!(e.start&&g<e.start))n++;d=addDays(d,1)}return n}
function hhmm(min){return Math.floor(min/60)+":"+pad(Math.round(min%60))}
function viewReport(){var now=new Date();if(!repMonth)repMonth=[now.getFullYear(),now.getMonth()];var y=repMonth[0],m=repMonth[1],pre=y+"-"+pad(m+1),cur=(y===now.getFullYear()&&m===now.getMonth());
  var rows=D.emps.map(function(e){var ps=D.punches.filter(function(p){return p.emp===e.id&&p.date.slice(0,7)===pre&&p.out}).sort(function(a,b){return a.date<b.date?-1:1});
    var mn=ps.reduce(function(s,p){return s+Math.max(0,mins(p.out)-mins(p.in))},0);
    function cnt(t){return D.reqs.filter(function(r){return r.emp===e.id&&r.type===t&&(t==="sick"||r.status==="ok")}).reduce(function(s,r){var n=0,d=parse(r.from),z=parse(r.to);while(d<=z){if(iso(d).slice(0,7)===pre&&isWork(d)&&!closedDay(d))n++;d=addDays(d,1)}return s+n},0)}
    var vac=cnt("vac"),sick=cnt("sick"),tgt=targetDays(e,y,m)*DAY_H*60,now2=cur?targetDays(e,y,m,now)*DAY_H*60:tgt,off=(vac+sick)*DAY_H*60;
    return {e:e,ps:ps,mn:mn,vac:vac,sick:sick,tgt:tgt,now:now2,off:off}});
  var tot=rows.reduce(function(s,r){return s+r.mn},0);
  function pct(v,t){return t?Math.min(100,v/t*100):0}
  return '<div class="rp"><div class="rp-m"><button type="button" id="mPrev" aria-label="החודש הקודם"><svg><use href="#i-prev"/></svg></button><div class="rp-mt"><b>'+HEB_MONTHS[m]+" "+y+'</b><span>'+hhmm(tot)+' שעות '+(cur?"עד היום":"בחודש")+'</span></div><button type="button" id="mNext" aria-label="החודש הבא"><svg><use href="#i-next"/></svg></button></div>'+
    rows.map(function(r){var w=pct(r.mn,r.tgt),o=Math.min(100-w,pct(r.off,r.tgt)),mk=cur?pct(r.now,r.tgt):0;
      return '<div class="rp-p"><button type="button" class="rp-t" data-exp="'+r.e.id+'"><i class="pd '+r.e.cls+'"></i><b>'+esc(r.e.name)+'</b><span class="rp-s"><span><b>'+r.ps.length+'</b> ימים</span><span><b>'+r.vac+'</b> חופשה</span><span><b>'+r.sick+'</b> מחלה</span></span><span class="ltr rp-h">'+hhmm(r.mn)+'<i> / '+Math.round(r.tgt/60)+"</i></span></button>"+
        '<div class="rp-bar"><i style="width:'+w+'%"></i><i class="v" style="width:'+o+'%"></i>'+(cur&&mk<100?'<em style="right:'+mk+'%"></em>':"")+"</div>"+
        '<div hidden id="x'+r.e.id+'">'+(r.ps.length?r.ps.map(function(p){return '<div class="drow"><span>'+HEB_DAYS[parse(p.date).getDay()].slice(0,1)+"׳ "+parse(p.date).getDate()+'</span><span class="nn">'+esc(p.note||(p.inLoc==="out"?"מחוץ למשרד":""))+'</span><span class="tt">'+p.in+"–"+p.out+" · "+dur(mins(p.out)-mins(p.in))+"</span></div>"}).join(""):'<p class="sub">אין ימים בחודש הזה</p>')+"</div></div>"}).join("")+
    '<div class="rp-key"><span><i></i>שעות</span><span><i class="v"></i>חופשה ומחלה</span>'+(cur?'<span><i class="m"></i>היעד</span>':"")+'</div><p class="rp-note">היעד מחושב לפי '+DAY_H+' שעות עבודה ביום</p>'+
    '<button class="btn navy" type="button" id="xls" style="width:100%;margin-top:10px">ייצוא לאקסל</button></div>'}

/* ================= sunrise slider: night navy → violet → pink → Keenest blue (and back at exit) ================= */
APP_VERSION=27;
var RAMP_IN=[[0,[0,32,63]],[.3,[72,30,120]],[.55,[250,22,100]],[.78,[123,92,255]],[1,[6,179,229]]];
var RAMP_OUT=[[0,[6,179,229]],[.25,[123,92,255]],[.5,[250,22,100]],[.75,[72,30,120]],[1,[0,32,63]]];
function rampAt(st,t){t=Math.max(0,Math.min(1,t));for(var i=1;i<st.length;i++){if(t<=st[i][0]){var a=st[i-1],b=st[i],u=(t-a[0])/(b[0]-a[0]);u=u*u*(3-2*u);return a[1].map(function(v,j){return Math.round(v+(b[1][j]-v)*u)})}}return st[st.length-1][1]}
var _viewToday=viewToday;
viewToday=function(){var h=_viewToday();window.__rise=0;
  return h.replace('<span class="knob" id="knob"><svg><use href="#i-arrow"/></svg></span>','<span class="sky" id="sky"></span><span class="knob" id="knob"><svg class="k1"><use href="#i-moon"/></svg><svg class="k2"><use href="#i-sun"/></svg></span>')};
function bindSlide(){var slide=$("#slide"),knob=$("#knob"),lbl=$("#slbl"),sky=$("#sky");if(!slide||slide.classList.contains("done"))return;
  var exit=slide.classList.contains("exit"),drag=null,R=exit?RAMP_OUT:RAMP_IN,dir=exit?1:-1;
  if(exit){knob.querySelector(".k1").innerHTML='<use href="#i-sun"/>';knob.querySelector(".k2").innerHTML='<use href="#i-moon"/>'}
  function max(){return slide.clientWidth-knob.offsetWidth-10}
  /* the knob follows the finger; the colors follow the knob with a soft lag, so fast moves still blend slowly */
  var cur=0,target=0,raf=0,last=0,fast=false;
  function colors(p){lbl.style.opacity=String(Math.max(0,1-p*3));lbl.style.color=p>0.02?"rgb(255 255 255 / .85)":"";
    var c=rampAt(R,p),c2=rampAt(R,Math.max(0,p-.28));sky.style.opacity=String(Math.min(1,p*12));sky.style.background="linear-gradient("+(exit?90:270)+"deg,rgb("+c2+") 0%,rgb("+c+") 100%)";
    var q1=Math.max(0,Math.min(1,(.54-p)/.14)),q2=Math.max(0,Math.min(1,(p-.46)/.14));knob.querySelector(".k1").style.opacity=String(q1);knob.querySelector(".k1").style.transform="rotate("+(-p*90)+"deg) scale("+(.7+.3*q1)+")";knob.querySelector(".k2").style.opacity=String(q2);knob.querySelector(".k2").style.transform="rotate("+((1-p)*90)+"deg) scale("+(.7+.3*q2)+")";
    knob.style.setProperty("--kc","rgb("+c+")")}
  function tick(t){var dt=last?Math.min(64,t-last)/1000:0.016;last=t;cur+=(target-cur)*(1-Math.exp(-dt/(fast?0.12:0.28)));if(Math.abs(target-cur)<0.0015)cur=target;colors(cur);if(cur!==target)raf=requestAnimationFrame(tick);else{raf=0;last=0}}
  function paint(d){target=Math.max(0,Math.min(1,d/max()));knob.style.transform="translateX("+(dir*d)+"px)";if(!raf)raf=requestAnimationFrame(tick)}
  colors(0);knob.style.transform="translateX(0px)";
  knob.onpointerdown=function(e){if(busy)return;if(!window.__posP)window.__posP=getPos();drag={x:e.clientX,d:0};knob.setPointerCapture(e.pointerId);knob.style.transition="none";sky.style.transition="none"};
  knob.onpointermove=function(e){if(!drag)return;drag.d=Math.max(0,Math.min(max(),(e.clientX-drag.x)*dir));paint(drag.d)};
  function settle(to,cb){var from=Math.abs(parseFloat((knob.style.transform.match(/-?[\d.]+/)||[0])[0]))||0,t0=performance.now(),dur=Math.max(200,(to>0?560:750)*Math.abs(to-from)/Math.max(1,max()));
    (function step(){var u=Math.min(1,(performance.now()-t0)/dur),e2=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;paint(from+(to-from)*e2);if(u<1)requestAnimationFrame(step);else if(cb)cb()})()}
  function finish(){fast=true;if(cur<.9){setTimeout(finish,30);return}if(raf){cancelAnimationFrame(raf);raf=0}cur=target=1;colors(1);knob.style.transform="translateX("+(dir*max())+"px)";var fc=rampAt(R,1);slide.classList.add("arrived");
    sky.style.transition="background .7s cubic-bezier(.32,.72,0,1)";sky.style.background="rgb("+fc+")";
    lbl.style.transition="opacity .35s ease";lbl.style.opacity="0";
    setTimeout(function(){lbl.textContent=partOfDay();lbl.style.color="#fff";lbl.style.opacity="1"},300);
    setTimeout(function(){act()},520)}
  function end(){if(!drag)return;var ok=drag.d>max()*.8;drag=null;if(ok)settle(max(),finish);else settle(0)}
  knob.onpointerup=end;knob.onpointercancel=end;
  slide.onclick=function(e){if(e.target.closest(".knob")||drag||busy)return;if(!window.__posP)window.__posP=getPos();settle(max(),finish)};
  if(window.__slideIn){window.__slideIn=0;slide.style.opacity="0";requestAnimationFrame(function(){slide.style.transition="opacity .6s cubic-bezier(.32,.72,0,1)";slide.style.opacity="1"})}}
