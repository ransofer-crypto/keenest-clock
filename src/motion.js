/* ===== iOS motion layer (shared by all Keenest sites) ===== */
(function(){
  const RM=matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("touchstart",()=>{},{passive:true});
  const ghost=sel=>{if(RM.matches)return;const h=document.querySelector(sel);if(!h||!h.children.length)return;
    const g=document.createElement("div");g.className="ios-ghost";g.setAttribute("aria-hidden","true");
    [...h.children].forEach(c=>g.appendChild(c.cloneNode(true)));document.body.appendChild(g);setTimeout(()=>g.remove(),300)};
  const wrap=(name,sel)=>{const f=window[name];if(typeof f!=="function"||f.__ios)return;const w=function(){ghost(sel);return f.apply(this,arguments)};w.__ios=1;window[name]=w};
  wrap("closePop","#layer");wrap("closeSheet","#sheetHost");
  const SEG=".wseg,.seg,.dseg,nav.tabs,nav.nav";
  const ACT='[aria-pressed="true"],[aria-selected="true"],[aria-current="page"],.on,.active';
  const EASE=getComputedStyle(document.documentElement).getPropertyValue("--ios-move").trim()||"cubic-bezier(.25,1,.5,1)";
  const last=new Map();
  const box=el=>({x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight});
  function flip(){
    const seen={};
    document.querySelectorAll(SEG).forEach(c=>{
      const base=c.className.replace(/\s*ios-\S+/g,"");const k=base+"#"+(seen[base]=(seen[base]||0)+1);
      const btns=[...c.children].filter(x=>x.matches("button,a"));const a=btns.find(b=>b.matches(ACT));
      if(!a){last.delete(k);return}
      if(getComputedStyle(c).position==="static")c.style.position="relative";
      const now={i:btns.indexOf(a),...box(a)};const p=last.get(k);last.set(k,now);
      if(RM.matches||!p||p.i===now.i)return;
      let from=p;const run=c.querySelector(".ios-thumb");
      if(run){const r=run.getBoundingClientRect(),cr=c.getBoundingClientRect();from={x:r.left-cr.left-c.clientLeft,y:r.top-cr.top-c.clientTop,w:r.width,h:r.height};run.remove()}
      const cs=getComputedStyle(a);if(cs.backgroundColor==="rgba(0, 0, 0, 0)"&&cs.boxShadow==="none")return;
      const t=document.createElement("span");t.className="ios-thumb";
      Object.assign(t.style,{left:now.x+"px",top:now.y+"px",width:now.w+"px",height:now.h+"px",background:cs.backgroundColor,borderRadius:cs.borderRadius,boxShadow:cs.boxShadow});
      btns.forEach(b=>b.classList.add("ios-flip"));a.classList.add("ios-flip-on");c.insertBefore(t,c.firstChild);
      const an=t.animate([{transform:`translate(${from.x-now.x}px,${from.y-now.y}px)`,width:from.w+"px"},{transform:"translate(0,0)",width:now.w+"px"}],{duration:460,easing:EASE});
      an.onfinish=()=>{if(!t.isConnected)return;t.remove();btns.forEach(b=>b.classList.remove("ios-flip","ios-flip-on"))};
    });
  }
  let rowPos=new Map();
  function glide(){
    const v=document.getElementById("view");const busy=v&&/\b(a-tl|a-tr|a-load|ios-push|ios-back)\b/.test(v.className);
    const rows=document.querySelectorAll(".row.trow[data-task],.xwrap,[data-open]");const next=new Map();
    rows.forEach(r=>{const k=r.matches(".xwrap")?"x:"+(r.querySelector("[data-task]")?.dataset.task||""):(r.dataset.task||r.dataset.open);if(!k)return;
      let cur=0;const ga=r.getAnimations().filter(a=>a.id==="glide");
      if(ga.length){cur=parseFloat(getComputedStyle(r).top)||0;ga.forEach(a=>a.cancel())}
      let top=0;for(let e=r;e;e=e.offsetParent)top+=e.offsetTop;next.set(k,top);
      if(busy||RM.matches||r.closest(".xwrap")&&!r.matches(".xwrap"))return;
      const old=rowPos.get(k);if(old===undefined&&!ga.length)return;
      const d=(ga.length?top+cur:old)-top;
      if(Math.abs(d)<1||Math.abs(d)>600)return;
      if(getComputedStyle(r).position==="static")r.style.position="relative";
      const an=r.animate([{top:`${d}px`},{top:"0px"}],{duration:420,easing:EASE});an.id="glide";
    });
    rowPos=next;
  }
  const segScroll=new Map();
  document.addEventListener("scroll",e=>{const c=e.target;if(c&&c.matches&&c.matches(SEG))segScroll.set(c.className.replace(/\s*ios-\S+/g,""),c.scrollLeft)},true);
  function keepSeg(){
    document.querySelectorAll(SEG).forEach(c=>{if(c.scrollWidth<=c.clientWidth+1)return;
      const k=c.className.replace(/\s*ios-\S+/g,"");
      if(!c.__kept){c.__kept=1;if(segScroll.has(k))c.scrollLeft=segScroll.get(k)}
      const a=[...c.children].find(b=>b.matches&&b.matches(ACT));if(!a)return;
      const cr=c.getBoundingClientRect(),ar=a.getBoundingClientRect();let d=0;
      if(ar.left<cr.left+8)d=ar.left-cr.left-8;else if(ar.right>cr.right-8)d=ar.right-cr.right+8;
      if(Math.abs(d)>1)c.scrollBy({left:d,behavior:RM.matches?"auto":"smooth"});
    });
  }
  let openId=null,page;
  function marks(){
    const xw=document.querySelector(".xwrap");const id=xw&&xw.querySelector("[data-task]")?.dataset.task||null;
    if(xw&&id!==openId&&!RM.matches){xw.classList.add("ios-open");setTimeout(()=>xw.classList.remove("ios-open"),500)}openId=id;
    const S_=(typeof S!=="undefined"&&S&&typeof S==="object")?S:null;if(S_){const pv=S_.projView||null;
      if(page!==undefined&&pv!==page&&!RM.matches){const v=document.getElementById("view");if(v){const c=pv?"ios-push":"ios-back";v.classList.remove("ios-push","ios-back");void v.offsetWidth;v.classList.add(c);setTimeout(()=>v.classList.remove(c),520)}}page=pv}
  }
  const run=()=>{try{keepSeg();marks();flip();glide()}catch(_){}};
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["aria-pressed","aria-selected","aria-current"]});
  run();
})();
