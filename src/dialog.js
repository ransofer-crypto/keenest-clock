/* ===== Keenest dialog language — header with title + X, one wide primary button ===== */
(function(){
  const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const CLOSE=/^\s*(ביטול|סגירה)\s*$/;
  function polish(box,root,close){
    if(!box||box.dataset.kd)return;box.dataset.kd=1;
    if(box.querySelector(".rhd,.bhd")){root.classList.add("kd");return}
    const h=[...box.children].find(c=>c.tagName==="H3");
    root.classList.add("kd");
    const bar=box.querySelector(".actions,.btns");
    const cancel=bar&&[...bar.querySelectorAll("button")].find(b=>CLOSE.test(b.textContent)&&!b.classList.contains("bp"));
    if(bar){if(bar.querySelector(".bp,.btn:not(.ghost):not(.danger)"))bar.classList.add("kd-hasp")}
    if(h){const hd=document.createElement("div");hd.className="kd-hd";const t=document.createElement("div");t.className="kd-t";
      h.replaceWith(hd);t.appendChild(h);const sub=hd.nextElementSibling;if(sub&&sub.matches("p.sub"))t.appendChild(sub);
      const x=document.createElement("button");x.type="button";x.className="kd-x";x.setAttribute("aria-label","סגירה");x.innerHTML=X;
      x.onclick=()=>cancel?cancel.click():close();hd.append(t,x);
      if(cancel){cancel.hidden=true;if(bar&&![...bar.children].some(c=>!c.hidden&&!c.matches(".spacer")))bar.hidden=true}}
  }
  const wrapFn=(name,after)=>{const f=window[name];if(typeof f!=="function"||f.__kd)return;const w=function(){const r=f.apply(this,arguments);try{after(r)}catch(_){}return r};w.__kd=1;window[name]=w};
  wrapFn("openSheet",()=>{const sc=document.querySelector("#sheetHost .scrim");if(sc)polish(sc.querySelector(".sheet"),sc,()=>window.closeSheet())});
  wrapFn("pop",p=>{const el=p&&p.nodeType?p:document.querySelector("#layer .pop");if(el)polish(el,el,()=>window.closePop())});
})();
