/* ================= Keenest attendance clock ================= */
var $=function(s,r){return (r||document).querySelector(s)};
var HEB_DAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
var HEB_MONTHS=["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
function pad(n){return String(n).padStart(2,"0")}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function parse(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2],12)}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function hm(d){return pad(d.getHours())+":"+pad(d.getMinutes())}
function mins(t){if(!t)return 0;var p=t.split(":");return +p[0]*60+ +p[1]}
function dur(m){return Math.floor(m/60)+":"+pad(m%60)}
function nice(s){var d=parse(s);return d.getDate()+" ב"+HEB_MONTHS[d.getMonth()]}
function isWork(d){var w=d.getDay();return w<5}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

/* ---------- popups (Keenest dialog hooks) ---------- */
window.pop=function(html){var L=$("#layer");L.innerHTML='<div class="scrim"></div><div class="pop" role="dialog">'+html+"</div>";L.querySelector(".scrim").onclick=function(){closePop()};return L.querySelector(".pop")};
window.closePop=function(){$("#layer").innerHTML=""};
var toastT;function toast(text,undo){var o=document.querySelector(".toast");if(o)o.remove();var t=document.createElement("div");t.className="toast";t.textContent=text;
  if(undo){var b=document.createElement("button");b.textContent="ביטול";b.onclick=function(){t.remove();undo()};t.appendChild(b)}document.body.appendChild(t);clearTimeout(toastT);toastT=setTimeout(function(){t.remove()},3200)}

/* ---------- data (demo: kept in this browser; the real site keeps it on the server) ---------- */
var KEY="keenest-clock-v1",D;
function seed(){var today=new Date(),emps=[{id:"shalev",name:"שלו",cls:"s",start:iso(today),birthday:"",vac:12},{id:"adi",name:"עדי",cls:"a",start:"",birthday:"",vac:12}];
  var punches=[],reqs=[];var d=addDays(today,-1),n=0;
  while(n<12){if(isWork(d)){var a=8*60+50+((n*37)%25),b=17*60+50+((n*53)%40);var p={id:"p"+n,emp:"adi",date:iso(d),in:pad(Math.floor(a/60))+":"+pad(a%60),out:pad(Math.floor(b/60))+":"+pad(b%60),inLoc:"office",outLoc:"office",note:""};
      if(n===3){p.note="צילומים בנמל תל אביב";p.inLoc="out";p.outLoc="out"}punches.push(p);n++}d=addDays(d,-1)}
  var v1=addDays(today,9);while(!isWork(v1))v1=addDays(v1,1);var v2=v1;
  reqs.push({id:"r1",emp:"adi",type:"vac",from:iso(v1),to:iso(v2),days:1,status:"pending",late:false,note:"",created:iso(today)});
  var fd=punches[1];reqs.push({id:"r2",emp:"adi",type:"fix",date:fd.date,inT:fd.in,outT:"17:30",oldIn:fd.in,oldOut:fd.out,status:"pending",note:"שכחתי לצאת בזמן",created:iso(today)});
  return {emps:emps,punches:punches,reqs:reqs,oscar:"",demo:{who:"shalev",day:"",weather:"",loc:"office"}}}
function load(){try{D=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){D=null}if(!D)D=seed()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
load();
function emp(id){return D.emps.find(function(e){return e.id===id})}
function me(){return D.demo.who}
function isMgr(){return me()==="ran"}
function punchOf(id,date){return D.punches.find(function(p){return p.emp===id&&p.date===date})}
function reqsOf(id){return D.reqs.filter(function(r){return r.emp===id})}
function workDays(a,b){var n=0,d=parse(a),e=parse(b);while(d<=e){if(isWork(d))n++;d=addDays(d,1)}return n}
function onVac(id,date,st){return D.reqs.some(function(r){return r.emp===id&&(r.type==="vac"||r.type==="sick")&&(st?r.status===st:r.status!=="no")&&r.from<=date&&r.to>=date})}
function vacUsed(id){var y=new Date().getFullYear();return D.reqs.filter(function(r){return r.emp===id&&r.type==="vac"&&r.status==="ok"&&parse(r.from).getFullYear()===y}).reduce(function(s,r){return s+r.days},0)}
function sickUsed(id){var y=new Date().getFullYear();return D.reqs.filter(function(r){return r.emp===id&&r.type==="sick"&&parse(r.from).getFullYear()===y}).reduce(function(s,r){return s+r.days},0)}
function uid(){return "x"+Date.now().toString(36)+Math.floor(Math.random()*1e4)}

/* ---------- which day is it: holidays, personal days, weather, weekday ---------- */
var HF=new Intl.DateTimeFormat("en-u-ca-hebrew",{day:"numeric",month:"long"});
function heb(d){var p=HF.formatToParts(d),o={};p.forEach(function(x){o[x.type]=x.value});return {d:+o.day,m:o.month}}
function lastSunday(y,m){var d=new Date(y,m+1,0,12);while(d.getDay()!==0)d=addDays(d,-1);return iso(d)}
var SPEC={
 rosh:{n:"ראש השנה",fx:["חלת דבש","תפוח בדבש"],q:"שנה טובה ומתוקה!"},
 kippur:{n:"ערב יום כיפור",fx:["נר תשעה באב"],q:"גמר חתימה טובה."},
 sukkot:{n:"סוכות",fx:["בתוך הסוכה"],q:"חג סוכות שמח! מי בונה סוכה השנה?"},
 simchat:{n:"שמחת תורה",fx:["שרשרת דגלי ישראל","ספר תורה ודגלי ישראל"],quiet:1,q:"חג שמח! שיהיה יום שמח."},
 hanukkah:{n:"חנוכה",fx:["אורות חנוכה","קישוטי חנוכה","חנוכייה"],q:"חג אורים שמח!"},
 tubishvat:{n:"ט״ו בשבט",fx:["פריחה באוויר","שקדייה פורחת"],q:"ט״ו בשבט שמח! מי מביא פירות יבשים?"},
 purim:{n:"פורים",fx:["מסכות פורים","רעשן ומסכה"],q:"פורים שמח! מי הגיע היום בתחפושת?"},
 pesach:{n:"פסח",fx:["גבעות אביב","מצה וכלניות"],q:"חג פסח שמח! אביב בחוץ."},
 mimouna:{n:"מימונה",fx:["שולחן מימונה"],q:"מימונה שמחה! תרבחו ותסעדו."},
 shoah:{n:"יום השואה",fx:["נר תשעה באב"],q:"יום הזיכרון לשואה ולגבורה. נזכור."},
 zikaron:{n:"יום הזיכרון",fx:["נר תשעה באב"],q:"יום הזיכרון לחללי מערכות ישראל. נזכור."},
 atzmaut:{n:"יום העצמאות",fx:["שרשרת דגלי ישראל","פטישים מתנפחים","דגל ומנגל"],q:"חג עצמאות שמח!"},
 lagbaomer:{n:"ל״ג בעומר",fx:["לילה של מדורה","מדורת ל\"ג בעומר"],q:"ל״ג בעומר שמח! מי מביא תפוחי אדמה?"},
 yerushalayim:{n:"יום ירושלים",fx:["ירושלים של זהב"],q:"יום ירושלים שמח."},
 shavuot:{n:"שבועות",fx:["שדה חיטה","אלומת חיטה"],q:"חג שבועות שמח! עוגת גבינה במטבחון?"},
 tishabeav:{n:"תשעה באב",fx:["נר תשעה באב"],q:"תשעה באב. יום שקט."},
 tubeav:{n:"ט״ו באב",fx:["ירח ולבבות"],q:"ט״ו באב שמח, חג האהבה."},
 newyear:{n:"שנה אזרחית חדשה",fx:["קישוטי זהב","כוסות שמתנגשות"],q:"שנה חדשה, דף חדש. שתהיה שנה טובה!"},
 leap:{n:"29 בפברואר",fx:["דף 29"],q:"29 בפברואר. יום בונוס בלוח השנה."},
 dstS:{n:"מעבר לשעון קיץ",fx:["מעבר שעון"],dst:1,q:"עברנו לשעון קיץ. שעה פחות שינה, שעה יותר אור."},
 dstW:{n:"מעבר לשעון חורף",fx:["מעבר שעון"],dst:-1,q:"עברנו לשעון חורף. קיבלנו שעה במתנה."},
 photo:{n:"יום הצילום הבינלאומי",fx:["פלאשים של צלמים"],q:"יום הצילום הבינלאומי. מה צילמת לאחרונה?"},
 oscar:{n:"הבוקר שאחרי האוסקר",fx:["פסלון האוסקר"],q:"האוסקר הולך ל... מי שנכנס בזמן היום."},
 longest:{n:"היום הארוך בשנה",fx:["שמש זורחת"],q:"היום הארוך בשנה. תיהנה מהאור."},
 birthday:{n:"יום הולדת",fx:["עוגה עם נרות"],q:"מזל טוב, {name}! שתהיה לך שנה מעולה."},
 anniv:{n:"שנה בעבודה",fx:["קונפטי זהב"],q:"{years} בקינסט! תודה על כל יום."},
 prevac:{n:"יום אחרון לפני חופשה",fx:["מטוס ממריא"],q:"מחר חופש! שיהיה נעים, נתראה כשתחזור."},
 rain:{n:"יורד גשם",fx:["גשם","מטריה"],q:"יורד גשם בחוץ. מקווים שלא שכחת מטריה."},
 heat:{n:"שרב",fx:["שמש בפינה"],q:"חם בחוץ. טוב שיש מזגן."},
 cold:{n:"יום קר",fx:["ספל סרוג"],q:"קר בחוץ. זמן לשוקו חם."},
 wind:{n:"רוח חזקה",fx:["עלים ברוח"],q:"רוח חזקה היום. תחזיק את הכובע."},
 thu:{n:"יום חמישי",fx:["יום חמישי"],q:"חמישי. עוד קצת וסופ״ש."},
 thuSummer:{n:"חמישי בקיץ",fx:["חוף חי"],q:"חמישי. ים אחרי העבודה?"}
};
var POOL={0:[["מכונת אספרסו","ראשון. קודם קפה, אחר כך כל השאר."],["תריסים ואור","ראשון. פותחים את התריסים, ואת השבוע."],["כוכב נופל","ראשון. תביע משאלה, ואז תתחיל לעבוד."]],
 1:[["צמח שגדל","שני. מה שהתחלנו אתמול כבר צומח."],["מנורת שולחן","שני. מדליקים אור על מה שחשוב היום."],["נורה מהחוט","שני. יום טוב לרעיון אחד גדול."]],
 2:[["שתי חמניות","שלישי. פעמיים כי טוב."],["כדור פורח יפה","שלישי. היום רק עולים למעלה."],["פטיפון","שלישי. יום עם קצב טוב."]],
 3:[["עפיפון","רביעי. מחזיקים חזק ונותנים לזה לעוף."],["עריסת ניוטון","רביעי. הכול בתנועה, והכול באיזון."],["דג זהב","רביעי. שוחים לאט לסוף השבוע."]]};
var ORD=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שביעי","שמיני"];
function holidayOf(d){var h=heb(d),m=h.m,x=h.d,g=iso(d),md=g.slice(5);
  if((m==="Elul"&&x===29)||(m==="Tishri"&&x<=2))return "rosh";
  if(m==="Tishri"&&x===9)return "kippur";
  if(m==="Tishri"&&x>=14&&x<=21)return "sukkot";
  if(m==="Tishri"&&x===22)return "simchat";
  if((m==="Kislev"&&x>=24)||(m==="Tevet"&&x<=3)){var n=hanNight(d);if(n>=1&&n<=8)return "hanukkah"}
  if(m==="Shevat"&&x===15)return "tubishvat";
  if((m==="Adar"||m==="Adar II")&&x===14)return "purim";
  if(m==="Nisan"&&x>=14&&x<=21)return "pesach";
  if(m==="Nisan"&&x===22)return "mimouna";
  if(m==="Nisan"&&x===27)return "shoah";
  if(m==="Iyar"&&x===4)return "zikaron";
  if(m==="Iyar"&&x===5)return "atzmaut";
  if(m==="Iyar"&&x===18)return "lagbaomer";
  if(m==="Iyar"&&x===28)return "yerushalayim";
  if(m==="Sivan"&&(x===5||x===6))return "shavuot";
  if(m==="Av"&&x===9)return "tishabeav";
  if(m==="Av"&&x===15)return "tubeav";
  if(md==="01-01")return "newyear";
  return null}
function hanNight(d){for(var i=0;i<10;i++){var h=heb(addDays(d,-i));if(h.m==="Kislev"&&h.d===24)return i+1}return 0}
function specialOf(d){var g=iso(d),md=g.slice(5),y=d.getFullYear();
  if(md==="02-29")return "leap";
  if(g===lastSunday(y,2))return "dstS";
  if(g===lastSunday(y,9))return "dstW";
  if(md==="08-19")return "photo";
  if(D.oscar&&g===D.oscar)return "oscar";
  if(md==="06-21")return "longest";
  return null}
function personalOf(d,e){if(!e)return null;var g=iso(d),md=g.slice(5);
  if(e.birthday&&e.birthday.slice(5)===md)return {k:"birthday",name:e.name};
  if(e.start&&e.start.slice(5)===md&&+e.start.slice(0,4)<d.getFullYear())return {k:"anniv",years:d.getFullYear()-(+e.start.slice(0,4))};
  var nx=addDays(d,1);while(!isWork(nx))nx=addDays(nx,1);if(onVac(e.id,iso(nx),"ok")&&!onVac(e.id,g))return {k:"prevac"};
  return null}
function weekNo(d){var a=new Date(d.getFullYear(),0,1);return Math.floor((d-a)/604800000)}
function dayLook(d,e,demoKey){var k=demoKey,extra={};
  if(!k){k=holidayOf(d);
    if(!k){var p=personalOf(d,e);if(p){k=p.k;extra=p}}
    if(!k)k=specialOf(d);
    if(!k&&D.demo.weather)k=D.demo.weather;
    if(!k&&d.getDay()===4){var mo=d.getMonth();k=(mo>=5&&mo<=8)?"thuSummer":"thu"}}
  if(k&&k.indexOf("pool:")===0){var pp=k.split(":");var it=POOL[+pp[1]][+pp[2]];return {fx:[it[0]],q:it[1],n:HEB_DAYS[+pp[1]]}}
  if(k&&SPEC[k]){var s=SPEC[k],q=s.q;if(e)q=q.replace("{name}",e.name);if(k==="birthday"&&extra.name)q=s.q.replace("{name}",extra.name);
    if(k==="anniv"){var yy=extra.years||1;q=s.q.replace("{years}",yy===1?"שנה":yy+" שנים")}
    var night=k==="hanukkah"?(demoKey?3:hanNight(d)):0;if(night)q="חג אורים שמח! הערב נר "+ORD[night-1]+" של חנוכה.";
    return {fx:s.fx,q:q,n:s.n,quiet:s.quiet,dst:s.dst,night:night}}
  var w=d.getDay();if(w>3)w=0;var pool=POOL[w].slice(),mo2=d.getMonth();
  if(mo2>=8&&mo2<=10)pool.push(["עץ בשלכת","סתיו. זמן לקפוצ'ון."]);
  if(mo2>=2&&mo2<=4)pool.push(["פרחי בר","אביב. פותחים חלון."]);
  var it2=pool[(weekNo(d)+d.getDay())%pool.length];return {fx:[it2[0]],q:it2[1],n:HEB_DAYS[d.getDay()]}}

/* ---------- views ---------- */
var tab="today",slideBusy=false;
function navHtml(){var t=isMgr()?[["team","צוות","i-team"],["approve","לאישור","i-check"],["report","דוח","i-chart"]]:[["today","היום","i-clock"],["week","השבוע","i-list"],["vac","חופשות","i-sun"]];
  var pend=D.reqs.filter(function(r){return r.status==="pending"}).length;
  return t.map(function(x){return '<button type="button" data-tab="'+x[0]+'" aria-selected="'+(tab===x[0])+'"><svg><use href="#'+x[2]+'"/></svg>'+x[1]+(x[0]==="approve"&&pend?'<span class="cnt">'+pend+"</span>":"")+"</button>"}).join("")}
function render(dir){var v=$("#view");$("#tabs").innerHTML=navHtml();$("#demoWho").textContent=isMgr()?"רן (מנהל)":emp(me()).name;
  $("#themeBtn").style.visibility=(tab==="today"||tab==="team")?"visible":"hidden";
  if(tab!=="today"){FX.stop();setVeil("")}
  v.innerHTML=tab==="today"?viewToday():tab==="week"?viewWeek():tab==="vac"?viewVac():tab==="team"?viewTeam():tab==="approve"?viewApprove():viewReport();
  if(dir){v.classList.remove("a-tl","a-tr");void v.offsetWidth;v.classList.add(dir);setTimeout(function(){v.classList.remove(dir)},450)}
  if(tab==="today")afterToday()}
function setVeil(c){var el=$("#veil");el.className="veil"+(c?" "+c:"")}
function todayLook(){var e=emp(me());var dk=D.demo.day;return dayLook(dk?new Date():new Date(),e,dk||null)}
function viewToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g),look=todayLook(),vacToday=onVac(e.id,g,"ok");
  var st=!p?"before":p.out?"done":"in";
  var tHtml=st==="before"?'<span class="t wait">—:—</span>':st==="in"?'<span class="t">'+p.in+"</span>":'<span class="t pair">'+p.in+'<span class="dash"> – </span>'+p.out+"</span>";
  var lab=st==="before"?(vacToday?"היום אתה בחופשה":"עוד לא נכנסת"):st==="in"?"נכנסת ב":"היום";
  var note=(p&&p.note)||(D.pre&&D.pre[e.id+g])||"";
  var flag=p&&p.inLoc==="out"&&!note?'<span class="locflag">נכנסת מחוץ למשרד</span>':"";
  return '<section class="mock"><span class="d">יום '+HEB_DAYS[new Date().getDay()]+" · "+nice(g)+'</span><p class="q">'+esc(look.q)+'</p><span class="sp big"></span>'+
    '<span class="l">'+lab+"</span>"+tHtml+'<button type="button" class="where'+(note?" on":"")+'" id="whereBtn"><svg><use href="#i-pin"/></svg><span>'+(note?esc(note):"מחוץ למשרד היום?")+"</span></button>"+flag+
    '<span class="sp"></span><div class="slide'+(st==="in"?" exit":"")+(st==="done"?" done":"")+'" id="slide"><span class="knob" id="knob"><svg><use href="#i-arrow"/></svg></span><span class="lbl" id="slbl">'+(st==="before"?"החלק לכניסה":st==="in"?"החלק ליציאה":"יום טוב, נתראה מחר")+"</span></div></section>"}
function playLook(look){window.__quiet=!!look.quiet;window.__dst=look.dst||1;window.__night=look.night||8;FX.play(look.fx)}
function afterToday(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);
  if(p&&!p.out){setVeil("in");playLook(todayLook())}else if(p&&p.out){setVeil("out");playLook(todayLook())}else{FX.stop();setVeil("")}
  $("#whereBtn").onclick=whereDialog;bindSlide();
  var open=D.punches.find(function(q){return q.emp===e.id&&!q.out&&q.date<g});
  if(open&&!D.reqs.some(function(r){return r.type==="fix"&&r.emp===e.id&&r.date===open.date&&r.status==="pending"}))setTimeout(function(){forgotOut(open)},600)}
function bindSlide(){var slide=$("#slide"),knob=$("#knob"),lbl=$("#slbl");if(!slide||slide.classList.contains("done"))return;var drag=null;
  function max(){return slide.clientWidth-60}
  knob.onpointerdown=function(e){drag={x:e.clientX,d:0};knob.setPointerCapture(e.pointerId);knob.style.transition="none"};
  knob.onpointermove=function(e){if(!drag)return;drag.d=Math.max(0,Math.min(max(),drag.x-e.clientX));knob.style.transform="translateX("+(-drag.d)+"px)";lbl.style.opacity=String(1-drag.d/max())};
  function end(){if(!drag)return;var ok=drag.d>max()*.8;drag=null;knob.style.transition="transform .42s var(--ios-move)";
    if(ok){knob.style.transform="translateX("+(-max())+"px)";setTimeout(function(){act();knob.style.transform="";lbl.style.opacity=""},260)}else{knob.style.transform="";lbl.style.opacity=""}}
  knob.onpointerup=end;knob.onpointercancel=end;
  slide.onclick=function(e){if(e.target.closest(".knob"))return;act()}}
function act(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g),away=D.demo.loc==="out";
  if(!p){if(away){var b=pop('<h3>אתה לא במשרד</h3><p>בטוח שאתה רוצה לעשות כניסה מכאן?</p><div class="btns"><button class="bp" id="goIn">כניסה בכל זאת</button><button class="bs">ביטול</button></div>');
      b.querySelector("#goIn").onclick=function(){closePop();clockIn("out")};b.querySelector(".bs").onclick=closePop;return}clockIn("office");return}
  if(!p.out){if(away){outAway(p);return}clockOut(p,hm(new Date()),"office")}}
function clockIn(loc){var e=emp(me()),g=iso(new Date()),t=hm(new Date());var pre=D.pre&&D.pre[e.id+g]||"";D.punches.push({id:uid(),emp:e.id,date:g,in:t,out:null,inLoc:loc,outLoc:"",note:pre});save();render();toast("בוקר טוב! נכנסת ב־"+t)}
function clockOut(p,t,loc){p.out=t;p.outLoc=loc;save();render();toast("יצאת ב־"+t+". ערב טוב!")}
function outAway(p){var b=pop('<h3>אתה לא במשרד</h3><p class="sub">מתי יצאת?</p><div class="seg" id="whenSeg"><button type="button" aria-pressed="true" data-w="now">עכשיו</button><button type="button" aria-pressed="false" data-w="before">קודם</button></div><div class="form" id="tBox" hidden><div class="fld"><label for="outT">שעת יציאה</label><input id="outT" type="time" value="'+hm(addDays(new Date(),0))+'"></div></div><p id="tNote" hidden>שעה מוקדמת נשלחת לאישור של רן או צפריר.</p><div class="btns"><button class="bp" id="okOut">יציאה</button><button class="bs">ביטול</button></div>');
  var w="now";b.querySelectorAll("#whenSeg button").forEach(function(x){x.onclick=function(){w=x.dataset.w;b.querySelectorAll("#whenSeg button").forEach(function(y){y.setAttribute("aria-pressed",y===x)});b.querySelector("#tBox").hidden=w!=="before";b.querySelector("#tNote").hidden=w!=="before";b.querySelector("#okOut").textContent=w==="before"?"שליחה לאישור":"יציאה"}});
  b.querySelector(".bs").onclick=closePop;
  b.querySelector("#okOut").onclick=function(){if(w==="now"){closePop();clockOut(p,hm(new Date()),"out");return}var t=b.querySelector("#outT").value;if(!t)return;closePop();
    D.reqs.push({id:uid(),emp:p.emp,type:"fix",date:p.date,inT:p.in,outT:t,oldIn:p.in,oldOut:"",status:"pending",note:"יציאה מאוחרת מחוץ למשרד",created:iso(new Date())});p.out=t;p.outLoc="out";p.pending=1;save();render();toast("שעת היציאה נשלחה לאישור")}}
function forgotOut(p){var b=pop('<h3>שכחת לצאת</h3><p class="sub">'+HEB_DAYS[parse(p.date).getDay()]+", "+nice(p.date)+'</p><p>נכנסת ב־'+p.in+' ולא נרשמה יציאה. מתי יצאת?</p><div class="form"><div class="fld"><label for="fo">שעת יציאה</label><input id="fo" type="time" value="18:00"></div></div><div class="btns"><button class="bp" id="foOk">שליחה לאישור</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#foOk").onclick=function(){var t=b.querySelector("#fo").value;if(!t)return;closePop();D.reqs.push({id:uid(),emp:p.emp,type:"fix",date:p.date,inT:p.in,outT:t,oldIn:p.in,oldOut:"",status:"pending",note:"שכחתי לצאת",created:iso(new Date())});p.out=t;p.pending=1;save();toast("נשלח לאישור של רן וצפריר")}}
function whereDialog(){var e=emp(me()),g=iso(new Date()),p=punchOf(e.id,g);D.pre=D.pre||{};var cur=(p&&p.note)||D.pre[e.id+g]||"";
  var b=pop('<h3>מחוץ למשרד היום?</h3><p class="sub">אפשר לכתוב איפה אתה, למשל צילומים</p><div class="chips">'+["צילומים","פגישה אצל לקוח","עבודה מהבית"].map(function(c){return '<button type="button">'+c+"</button>"}).join("")+'</div><textarea class="note" id="wn" placeholder="צילומים בנמל תל אביב">'+esc(cur)+'</textarea><div class="btns"><button class="bp" id="wOk">שמירה</button>'+(cur?'<button class="bred" id="wDel">בעצם אני במשרד</button>':"")+'<button class="bs">ביטול</button></div>');
  b.querySelectorAll(".chips button").forEach(function(c){c.onclick=function(){var ta=b.querySelector("#wn");ta.value=c.textContent+" ";ta.focus()}});
  b.querySelector(".bs").onclick=closePop;
  function set(v){if(p)p.note=v;else D.pre[e.id+g]=v;save();closePop();render()}
  b.querySelector("#wOk").onclick=function(){set(b.querySelector("#wn").value.trim())};var dl=b.querySelector("#wDel");if(dl)dl.onclick=function(){set("")}}

/* week */
function weekRows(id,startSun){var h="",st=emp(id).start||"";for(var i=0;i<5;i++){var d=addDays(startSun,i),g=iso(d);if(g<st)continue;var p=punchOf(id,g),fut=g>iso(new Date()),isT=g===iso(new Date());
    var pend=D.reqs.find(function(r){return r.emp===id&&r.type==="fix"&&r.date===g&&r.status==="pending"});var vac=D.reqs.find(function(r){return r.emp===id&&(r.type==="vac"||r.type==="sick")&&r.status!=="no"&&r.from<=g&&r.to>=g});
    var tm=p?(p.in+" – "+(p.out||"")):"",badge=pend?'<span class="badge wait">מחכה לאישור</span>':vac?'<span class="badge '+(vac.type==="sick"?"sick":vac.status==="pending"?"wait":"vac")+'">'+(vac.type==="sick"?"מחלה":vac.status==="pending"?"חופשה, מחכה":"חופשה")+"</span>":(p&&(p.inLoc==="out"||p.outLoc==="out")&&!p.note?'<span class="badge out">מחוץ למשרד</span>':"");
    h+='<button type="button" class="row'+(isT?" today":"")+(fut?" off":"")+'" data-open="w'+g+'" data-date="'+g+'"><span class="main"><span class="t1">'+HEB_DAYS[d.getDay()]+'</span><span class="t2">'+nice(g)+(p&&p.note?" · "+esc(p.note):"")+'</span></span><span class="side">'+(tm?'<span class="tm">'+tm+"</span>":"")+badge+"</span></button>"}return h}
function sundayOf(d){return addDays(d,-d.getDay())}
function viewWeek(){var e=emp(me()),s=sundayOf(new Date()),last=weekRows(e.id,addDays(s,-7));
  return '<div class="ph"><h1>השבוע</h1></div><div class="list">'+weekRows(e.id,s)+'</div>'+(last?'<p class="hd">שבוע שעבר</p><div class="list">'+last+'</div>':"")+'<p class="empty" style="text-align:right;padding:14px 4px">לחיצה על יום פותחת בקשת תיקון.</p>'}
function fixDialog(id,g){var p=punchOf(id,g);if(g>iso(new Date()))return;var b=pop('<h3>תיקון שעות</h3><p class="sub">'+HEB_DAYS[parse(g).getDay()]+", "+nice(g)+'</p><div class="form"><div class="fld"><label for="fi">כניסה</label><input id="fi" type="time" value="'+(p?p.in:"09:00")+'"></div><div class="fld"><label for="fo2">יציאה</label><input id="fo2" type="time" value="'+(p&&p.out?p.out:"18:00")+'"></div></div><textarea class="note" id="fr" placeholder="מה קרה? למשל שכחתי להחתים"></textarea><div class="btns"><button class="bp" id="fOk">שליחה לאישור</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#fOk").onclick=function(){var a=b.querySelector("#fi").value,c=b.querySelector("#fo2").value;if(!a||!c)return;closePop();
    D.reqs.push({id:uid(),emp:id,type:"fix",date:g,inT:a,outT:c,oldIn:p?p.in:"",oldOut:p&&p.out?p.out:"",status:"pending",note:b.querySelector("#fr").value.trim(),created:iso(new Date())});save();render();toast("התיקון נשלח לאישור")}}

/* vacations */
function reqLabel(r){if(r.type==="fix")return "תיקון שעות · "+nice(r.date);var t=r.type==="sick"?"מחלה":"חופשה";return t+" · "+(r.from===r.to?nice(r.from):nice(r.from)+" עד "+nice(r.to))}
function statusBadge(r){if(r.type==="sick")return '<span class="badge sick">דווח</span>';return r.status==="pending"?'<span class="badge wait">מחכה לאישור</span>':r.status==="ok"?'<span class="badge ok">אושר</span>':'<span class="badge no">לא אושר</span>'}
function viewVac(){var e=emp(me()),left=e.vac-vacUsed(e.id),mine=reqsOf(e.id).filter(function(r){return r.type!=="fix"}).sort(function(a,b){return a.from<b.from?1:-1});
  return '<div class="ph"><h1>חופשות</h1></div><div class="bal"><div><b>'+left+'</b><span>ימי חופשה נותרו</span></div><div><b>'+sickUsed(e.id)+'</b><span>ימי מחלה השנה</span></div></div><div class="two"><button class="btn" id="askVac" type="button">בקשת חופשה</button><button class="btn ghost" id="askSick" type="button">דיווח מחלה</button></div>'+
    '<p class="hd">הבקשות שלי</p><div class="list">'+(mine.length?mine.map(function(r){return '<div class="row" data-open="'+r.id+'"><span class="main"><span class="t1">'+reqLabel(r)+'</span><span class="t2">'+(r.type==="vac"?r.days+" ימי עבודה":"")+(r.note?" · "+esc(r.note):"")+"</span></span>"+statusBadge(r)+"</div>"}).join(""):'<p class="empty">עוד אין בקשות. כשתבקש חופשה, היא תופיע כאן עם הסטטוס שלה.</p>')+"</div>"}
function noticeRule(days){return days<=2?7:days<5?14:30}
function vacDialog(){var t0=addDays(new Date(),14);while(!isWork(t0))t0=addDays(t0,1);
  var b=pop('<h3>בקשת חופשה</h3><p class="sub">הבקשה תגיע לרן ולצפריר</p><div class="form"><div class="fld"><label for="vf">מתאריך</label><input id="vf" type="date" value="'+iso(t0)+'"></div><div class="fld"><label for="vt">עד תאריך</label><input id="vt" type="date" value="'+iso(t0)+'"></div></div><p id="vInfo"></p><textarea class="note" id="vn" placeholder="הערה, לא חובה"></textarea><div class="btns"><button class="bp" id="vOk">שליחת בקשה</button><button class="bs">ביטול</button></div>');
  function upd(){var f=b.querySelector("#vf").value,t=b.querySelector("#vt").value,info=b.querySelector("#vInfo");if(!f||!t||t<f){info.textContent="בחר תאריכים";info.className="";return}
    var n=workDays(f,t),ahead=Math.round((parse(f)-parse(iso(new Date())))/864e5),need=noticeRule(n);info.innerHTML=n+" ימי עבודה"+(ahead<need?'<br><span class="warn">מומלץ לבקש '+(need===7?"שבוע":need===14?"שבועיים":"חודש")+" מראש. אפשר לשלוח, והבקשה תסומן כמאוחרת.</span>":"");info.className=""}
  b.querySelector("#vf").oninput=function(){var vt=b.querySelector("#vt");if(vt.value<this.value)vt.value=this.value;upd()};b.querySelector("#vt").oninput=upd;upd();
  b.querySelector(".bs").onclick=closePop;b.querySelector("#vOk").onclick=function(){var f=b.querySelector("#vf").value,t=b.querySelector("#vt").value;if(!f||!t||t<f)return;var n=workDays(f,t),ahead=Math.round((parse(f)-parse(iso(new Date())))/864e5);
    D.reqs.push({id:uid(),emp:me(),type:"vac",from:f,to:t,days:n,status:"pending",late:ahead<noticeRule(n),note:b.querySelector("#vn").value.trim(),created:iso(new Date())});save();closePop();render();toast("הבקשה נשלחה לרן וצפריר")}}
function sickDialog(){var g=iso(new Date());var b=pop('<h3>דיווח מחלה</h3><p class="sub">לא צריך אישור מראש. רפואה שלמה!</p><div class="form"><div class="fld"><label for="sf">מתאריך</label><input id="sf" type="date" value="'+g+'"></div><div class="fld"><label for="st">עד תאריך</label><input id="st" type="date" value="'+g+'"></div></div><div class="btns"><button class="bp" id="sOk">דיווח</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#sOk").onclick=function(){var f=b.querySelector("#sf").value,t=b.querySelector("#st").value;if(!f||!t||t<f)return;D.reqs.push({id:uid(),emp:me(),type:"sick",from:f,to:t,days:workDays(f,t),status:"ok",note:"",created:iso(new Date())});save();closePop();render();toast("הדיווח נשלח. רפואה שלמה")}}

/* manager: team */
function statusOf(e){var g=iso(new Date()),p=punchOf(e.id,g);if(onVac(e.id,g,"ok")){var r=D.reqs.find(function(r){return r.emp===e.id&&(r.type==="vac"||r.type==="sick")&&r.status==="ok"&&r.from<=g&&r.to>=g});return r.type==="sick"?"חולה היום":"בחופשה היום"}
  if(!p)return "עוד לא נכנס";if(!p.out)return "נכנס ב־"+p.in+(p.inLoc==="out"?" · מחוץ למשרד":" · משרד");return p.in+" – "+p.out}
function viewTeam(){var g=iso(new Date());return '<div class="ph"><h1>היום</h1><span class="sub">יום '+HEB_DAYS[new Date().getDay()]+" · "+nice(g)+'</span></div><div class="list">'+D.emps.map(function(e){var p=punchOf(e.id,g);return '<button type="button" class="row" data-open="e'+e.id+'" data-emp="'+e.id+'"><span class="av '+e.cls+'">'+e.name[0]+'</span><span class="main"><span class="t1">'+e.name+'</span><span class="t2">'+esc(statusOf(e))+(p&&p.note?" · "+esc(p.note):"")+'</span></span>'+(p&&!p.out?'<span class="badge ok">במשרד</span>':"")+"</button>"}).join("")+'</div><p class="hd">השבוע של הצוות</p>'+D.emps.map(function(e){return '<p class="lbl2" style="margin:12px 4px 0">'+e.name+'</p><div class="list">'+weekRows(e.id,sundayOf(new Date()))+"</div>"}).join("")}
function empDialog(id){var e=emp(id);var b=pop('<h3>'+e.name+'</h3><p class="sub">פרטים שמשפיעים על הימים המיוחדים ועל החופשות</p><div class="form"><div class="fld"><label for="es">תחילת עבודה</label><input id="es" type="date" value="'+(e.start||"")+'"></div><div class="fld"><label for="eb">יום הולדת</label><input id="eb" type="date" value="'+(e.birthday||"")+'"></div><div class="fld"><label for="ev">ימי חופשה בשנה</label><input id="ev" type="number" min="0" max="40" value="'+e.vac+'"></div></div><div class="btns"><button class="bp" id="eOk">שמירה</button><button class="bs">ביטול</button></div>');
  b.querySelector(".bs").onclick=closePop;b.querySelector("#eOk").onclick=function(){e.start=b.querySelector("#es").value;e.birthday=b.querySelector("#eb").value;e.vac=+b.querySelector("#ev").value||0;save();closePop();render();toast("נשמר")}}

/* manager: approvals */
function viewApprove(){var pend=D.reqs.filter(function(r){return r.status==="pending"}).sort(function(a,b){return a.created<b.created?-1:1}),done=D.reqs.filter(function(r){return r.status!=="pending"&&r.type!=="sick"}).slice(-5).reverse();
  return '<div class="ph"><h1>לאישור</h1></div><div class="list">'+(pend.length?pend.map(function(r){var e=emp(r.emp),det=r.type==="fix"?("כניסה "+r.inT+" · יציאה "+r.outT+(r.oldOut?" (היה "+r.oldOut+")":"")):(r.days+" ימי עבודה · נשארו "+(e.vac-vacUsed(e.id)));
      return '<div class="row" data-open="'+r.id+'"><span class="av '+e.cls+'">'+e.name[0]+'</span><span class="main"><span class="t1">'+e.name+" · "+reqLabel(r)+'</span><span class="t2">'+det+(r.note?" · "+esc(r.note):"")+"</span>"+(r.late?'<span class="badge wait" style="align-self:flex-start;margin-top:3px">הוגשה מאוחר מהמדיניות</span>':"")+'</span><span class="acts"><button class="rnd no" data-no="'+r.id+'" aria-label="דחייה"><svg><use href="#i-x"/></svg></button><button class="rnd ok" data-ok="'+r.id+'" aria-label="אישור"><svg><use href="#i-check"/></svg></button></span></div>'}).join(""):'<p class="empty">אין כרגע בקשות שמחכות. כשעדי או שלו יבקשו חופשה או תיקון שעות, זה יופיע כאן.</p>')+"</div>"+
    (done.length?'<p class="hd">טופלו לאחרונה</p><div class="list">'+done.map(function(r){var e=emp(r.emp);return '<div class="row" data-open="d'+r.id+'"><span class="main"><span class="t1">'+e.name+" · "+reqLabel(r)+'</span></span>'+statusBadge(r)+"</div>"}).join("")+"</div>":"")}
function decide(id,ok){var r=D.reqs.find(function(x){return x.id===id});if(!r)return;var prev=JSON.stringify(D);r.status=ok?"ok":"no";
  if(r.type==="fix"){var p=punchOf(r.emp,r.date);if(ok){if(!p){p={id:uid(),emp:r.emp,date:r.date,in:r.inT,out:r.outT,inLoc:"office",outLoc:"office",note:""};D.punches.push(p)}else{p.in=r.inT;p.out=r.outT;delete p.pending}}else if(p&&p.pending){p.out=r.oldOut||null;delete p.pending}}
  save();render();toast(ok?"אושר":"נדחה",function(){D=JSON.parse(prev);save();render()})}

/* manager: report */
var repMonth=null;
function viewReport(){var now=new Date();if(!repMonth)repMonth=[now.getFullYear(),now.getMonth()];var y=repMonth[0],m=repMonth[1],pre=y+"-"+pad(m+1);
  return '<div class="ph"><h1>דוח חודשי</h1><div class="mnav"><button type="button" id="mPrev" aria-label="החודש הקודם"><svg><use href="#i-prev"/></svg></button><b>'+HEB_MONTHS[m]+" "+y+'</b><button type="button" id="mNext" aria-label="החודש הבא"><svg><use href="#i-next"/></svg></button></div></div>'+
    D.emps.map(function(e){var ps=D.punches.filter(function(p){return p.emp===e.id&&p.date.slice(0,7)===pre&&p.out}).sort(function(a,b){return a.date<b.date?-1:1});var tot=ps.reduce(function(s,p){return s+Math.max(0,mins(p.out)-mins(p.in))},0);
      var vac=D.reqs.filter(function(r){return r.emp===e.id&&r.type==="vac"&&r.status==="ok"&&r.from.slice(0,7)===pre}).reduce(function(s,r){return s+r.days},0),sick=D.reqs.filter(function(r){return r.emp===e.id&&r.type==="sick"&&r.from.slice(0,7)===pre}).reduce(function(s,r){return s+r.days},0),out=ps.filter(function(p){return p.inLoc==="out"||p.outLoc==="out"}).length;
      return '<div class="empcard"><div class="emph"><span class="av '+e.cls+'">'+e.name[0]+'</span><b>'+e.name+'</b></div><div class="kpis"><div class="kpi"><b>'+ps.length+'</b><span>ימי עבודה</span></div><div class="kpi"><b class="ltr">'+dur(tot)+'</b><span>שעות</span></div><div class="kpi"><b>'+vac+" / "+sick+'</b><span>חופשה / מחלה</span></div></div>'+(out?'<p class="lbl2" style="margin:6px 4px 0">'+out+" ימים מחוץ למשרד</p>":"")+
        '<button class="exp" type="button" data-exp="'+e.id+'">פירוט לפי ימים</button><div hidden id="x'+e.id+'">'+(ps.length?ps.map(function(p){return '<div class="drow"><span>'+HEB_DAYS[parse(p.date).getDay()].slice(0,1)+"׳ "+parse(p.date).getDate()+'</span><span class="nn">'+esc(p.note||(p.inLoc==="out"?"מחוץ למשרד":""))+'</span><span class="tt">'+p.in+"–"+p.out+" · "+dur(mins(p.out)-mins(p.in))+"</span></div>"}).join(""):'<p class="empty">אין ימים בחודש הזה</p>')+"</div></div>"}).join("")+
    '<button class="btn navy" type="button" id="xls" style="width:100%;margin-top:14px">ייצוא לאקסל</button>'}
function exportCsv(){var y=repMonth[0],m=repMonth[1],pre=y+"-"+pad(m+1),rows=[["עובד","תאריך","יום","כניסה","יציאה","שעות","מיקום","הערה"]];
  D.emps.forEach(function(e){D.punches.filter(function(p){return p.emp===e.id&&p.date.slice(0,7)===pre&&p.out}).sort(function(a,b){return a.date<b.date?-1:1}).forEach(function(p){rows.push([e.name,p.date,HEB_DAYS[parse(p.date).getDay()],p.in,p.out,dur(mins(p.out)-mins(p.in)),(p.inLoc==="out"||p.outLoc==="out")?"מחוץ למשרד":"משרד",p.note||""])});
    D.reqs.filter(function(r){return r.emp===e.id&&(r.type==="vac"&&r.status==="ok"||r.type==="sick")&&r.from.slice(0,7)===pre}).forEach(function(r){rows.push([e.name,r.from+(r.to!==r.from?" עד "+r.to:""),"",r.type==="vac"?"חופשה":"מחלה","",r.days+" ימים","",""])})});
  var csv="﻿"+rows.map(function(r){return r.map(function(c){c=String(c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(",")}).join("\n");
  var name="נוכחות-קינסט-"+pre+".csv";
  (async function(){try{var dl=window.claude&&claude.use?await claude.use("downloads"):null;if(!dl){toast("ההורדה תעבוד באתר עצמו");return}await dl.save({filename:name,data:new Blob([csv],{type:"text/csv"})});toast("הדוח ירד")}catch(err){toast("ההורדה בוטלה")}})()}

/* ---------- demo controls ---------- */
var DEMO_DAYS=[["","היום האמיתי"],["pool:0:0","ראשון · מכונת אספרסו"],["pool:0:1","ראשון · תריסים"],["pool:0:2","ראשון · כוכב נופל"],["pool:1:0","שני · צמח"],["pool:1:1","שני · מנורת שולחן"],["pool:1:2","שני · נורה"],["pool:2:0","שלישי · חמניות"],["pool:2:1","שלישי · כדור פורח"],["pool:2:2","שלישי · פטיפון"],["pool:3:0","רביעי · עפיפון"],["pool:3:1","רביעי · עריסת ניוטון"],["pool:3:2","רביעי · דג זהב"],["thu","חמישי"],["thuSummer","חמישי בקיץ"]]
 .concat(Object.keys(SPEC).filter(function(k){return ["thu","thuSummer"].indexOf(k)<0}).map(function(k){return [k,SPEC[k].n]}));
function demoDialog(){var dm=D.demo;var b=pop('<h3>הדמיה</h3><p class="sub">באתר האמיתי כל אחד מתחבר עם המשתמש שלו, המיקום מגיע מהטלפון ומזג האוויר מהתחזית. הנתונים כאן לדוגמה.</p>'+
  '<p class="lbl2">צפייה בתור</p><div class="seg" id="dWho">'+[["shalev","שלו"],["adi","עדי"],["ran","רן · מנהל"]].map(function(x){return '<button type="button" data-v="'+x[0]+'" aria-pressed="'+(dm.who===x[0])+'">'+x[1]+"</button>"}).join("")+"</div>"+
  '<p class="lbl2">מיקום ברגע ההחלקה</p><div class="seg" id="dLoc">'+[["office","במשרד"],["out","מחוץ למשרד"]].map(function(x){return '<button type="button" data-v="'+x[0]+'" aria-pressed="'+(dm.loc===x[0])+'">'+x[1]+"</button>"}).join("")+"</div>"+
  '<p class="lbl2">מזג האוויר היום</p><div class="seg" id="dW">'+[["","רגיל"],["rain","גשם"],["heat","שרב"],["cold","קר"],["wind","רוח"]].map(function(x){return '<button type="button" data-v="'+x[0]+'" aria-pressed="'+(dm.weather===x[0])+'">'+x[1]+"</button>"}).join("")+"</div>"+
  '<div class="form"><div class="fld"><label for="dDay">איך ייראה יום</label><select id="dDay">'+DEMO_DAYS.map(function(x){return '<option value="'+x[0]+'"'+(dm.day===x[0]?" selected":"")+">"+x[1]+"</option>"}).join("")+'</select></div><div class="fld"><label for="dOsc">ערב האוסקר</label><input id="dOsc" type="date" value="'+(D.oscar||"")+'"></div></div>'+
  '<div class="btns"><button class="bp" id="dOk">סגירה</button><button class="bred" id="dReset">איפוס נתוני הדוגמה</button></div>');
  ["dWho","dLoc","dW"].forEach(function(id){b.querySelectorAll("#"+id+" button").forEach(function(x){x.onclick=function(){b.querySelectorAll("#"+id+" button").forEach(function(y){y.setAttribute("aria-pressed",y===x)})}})});
  b.querySelector("#dOk").onclick=function(){var w=b.querySelector('#dWho [aria-pressed="true"]').dataset.v;var was=dm.who;dm.who=w;dm.loc=b.querySelector('#dLoc [aria-pressed="true"]').dataset.v;dm.weather=b.querySelector('#dW [aria-pressed="true"]').dataset.v;dm.day=b.querySelector("#dDay").value;D.oscar=b.querySelector("#dOsc").value;
    if(w!==was)tab=w==="ran"?"team":"today";save();closePop();render()};
  b.querySelector("#dReset").onclick=function(){var keep=D.demo;D=seed();D.demo=keep;save();closePop();render();toast("הנתונים אופסו")}}

/* ---------- wiring ---------- */
document.addEventListener("click",function(e){var t=e.target.closest("[data-tab]");if(t){var order=isMgr()?["team","approve","report"]:["today","week","vac"],a=order.indexOf(tab),b=order.indexOf(t.dataset.tab);if(t.dataset.tab===tab)return;tab=t.dataset.tab;render(b>a?"a-tl":"a-tr");return}
  var ok=e.target.closest("[data-ok]");if(ok){decide(ok.dataset.ok,true);return}var no=e.target.closest("[data-no]");if(no){decide(no.dataset.no,false);return}
  var ex=e.target.closest("[data-exp]");if(ex){var box=$("#x"+ex.dataset.exp);box.hidden=!box.hidden;ex.textContent=box.hidden?"פירוט לפי ימים":"הסתרת הפירוט";return}
  if(e.target.closest("#mPrev")){repMonth[1]--;if(repMonth[1]<0){repMonth[1]=11;repMonth[0]--}render("a-tr");return}
  if(e.target.closest("#mNext")){repMonth[1]++;if(repMonth[1]>11){repMonth[1]=0;repMonth[0]++}render("a-tl");return}
  if(e.target.closest("#xls")){exportCsv();return}
  if(e.target.closest("#askVac")){vacDialog();return}if(e.target.closest("#askSick")){sickDialog();return}
  var er=e.target.closest("[data-emp]");if(er){empDialog(er.dataset.emp);return}
  var dr=e.target.closest("[data-date]");if(dr&&!isMgr()){fixDialog(me(),dr.dataset.date);return}
});
$("#demoBtn").onclick=demoDialog;
$("#themeBtn").onclick=function(){var r=document.documentElement,t=r.getAttribute("data-theme"),dark=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.setAttribute("data-theme",dark?"light":"dark");if(tab==="today")afterToday()};
var rzT;window.addEventListener("resize",function(){clearTimeout(rzT);rzT=setTimeout(function(){if(tab==="today")FX.resize()},250)});
tab=isMgr()?"team":"today";render("a-load");
