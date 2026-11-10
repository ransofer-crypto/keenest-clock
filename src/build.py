import re,os
import os
S=os.path.dirname(os.path.abspath(__file__))+'/../'
C=S+'src/';O=S+''
head=open(C+'head.html').read().split('\n')
head=[l.replace('family=Heebo:wght@400;','family=Heebo:wght@300;400;') for l in head if 'claude:viewport-fit-sides' not in l and not l.startswith('<title>')]
app=open(C+'app.js').read().split('\n')
core='\n'.join(app[0:21]+app[44:257]).replace('isMgr()?"רן (מנהל)":emp(me()).name','emp(me()).name')
extra_css='''
.demo{background:var(--chip);color:var(--ink);box-shadow:0 4px 14px rgb(0 32 63 / .08);font-weight:600;font-size:13.5px;height:36px;padding:0 14px}
:root[data-theme="dark"] .demo{box-shadow:none}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .demo{box-shadow:none}}
.login{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:9vh;gap:6px}
.login .q{font-size:26px;font-weight:700;margin:0}
.login .sub{color:var(--muted);margin:0 0 18px}
.names{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px}
.nm{display:flex;align-items:center;gap:12px;height:58px;padding:0 10px;border:0;border-radius:18px;background:var(--chip);color:var(--ink);font:inherit;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgb(0 32 63 / .06)}
.nm .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--k-blue);color:#fff;font-weight:700}
/* no bottom bar: the menu lives in the top-right button */
nav.tabs{display:none!important}
#view{padding-bottom:calc(22px + env(safe-area-inset-bottom,0px))!important}
.app{padding-top:env(safe-area-inset-top,0px)}
/* no rubber-band pull: the body scrolls inside a fixed page */
html{height:100%;overflow:hidden;overscroll-behavior:none}
body{height:100%;overflow-y:auto;overscroll-behavior:none;-webkit-overflow-scrolling:touch}
.rb.menu{position:relative}
.rb.menu .mdot{position:absolute;top:9px;left:10px;width:8px;height:8px;border-radius:50%;background:var(--k-pink);box-shadow:0 0 0 2px var(--surface,#fff)}
.mlist{flex-shrink:0;display:flex;flex-direction:column;border-radius:16px;background:var(--field);overflow:hidden;margin:4px 0 6px}
.mlist button{display:flex;align-items:center;gap:12px;min-height:50px;padding:0 14px;border:0;background:none;font:inherit;font-size:16px;color:var(--ink);text-align:right;position:relative;cursor:pointer}
.mlist button+button::before{content:"";position:absolute;top:0;right:48px;left:0;height:.5px;background:var(--line)}
.mlist button svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;color:var(--muted)}
.mlist button[aria-current="true"]{font-weight:700}
.mlist button[aria-current="true"] svg{color:var(--k-blue)}
.mlist .cnt2{margin-inline-start:auto;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--k-pink);color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}
.mlist button.red{color:var(--k-pink)}.mlist button.red svg{color:var(--k-pink)}
.mwho{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.mwho .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700}
/* iOS 26 home-screen app: with the translucent status bar the viewport comes up short by the status-bar height (WebKit bug 301108); a taller html makes iOS give the page the full screen */
@media (display-mode: standalone){html{height:auto;min-height:min(100lvh,calc(100% + env(safe-area-inset-top,0px)))}body{height:min(100lvh,calc(100vh + env(safe-area-inset-top,0px)))}}
/* a little more air above the header and the greeting */
header.top{margin-top:14px}
.mock .hi{margin-top:30px;font-size:14.5px;font-weight:300;color:var(--muted);letter-spacing:.01em}
.mock .q{margin-top:8px}
.mock .l{font-size:14.5px;font-weight:300;letter-spacing:.01em;margin-bottom:6px}
.mock .t.wait2{font-size:30px;font-weight:300;letter-spacing:-.01em;color:var(--muted);line-height:1.2;direction:rtl;padding:12px 0}
.mock .d{margin-top:2px}
/* full-screen menu */
.fm{position:fixed;inset:0;z-index:40;background:var(--bg);opacity:0;transform:scale(1.02);transition:opacity .3s cubic-bezier(.32,.72,0,1),transform .3s cubic-bezier(.32,.72,0,1);overflow-y:auto;overscroll-behavior:contain}
.fm.show{opacity:1;transform:none}
.fm-in{max-width:560px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 14px) max(18px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 18px) max(18px,env(safe-area-inset-left,0px))}
.fm-top{display:flex;justify-content:space-between;align-items:center;height:56px;position:relative}
.fm-top .hlogo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:28px}
.fm-big{display:flex;flex-direction:column;margin-top:5vh}
.fm-big button{display:flex;align-items:center;gap:12px;border:0;background:none;font:inherit;font-size:38px;font-weight:800;letter-spacing:-.03em;color:var(--ink3);text-align:right;padding:6px 0;cursor:pointer;transition:color .2s}
.fm-big button.on{color:var(--ink)}
.fm-big .cnt2{min-width:24px;height:24px;border-radius:999px;background:var(--k-pink);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center;padding:0 7px;letter-spacing:0}
.fm-small{margin-top:auto;padding-top:24px;display:flex;flex-direction:column}
.fm-small button{display:flex;justify-content:space-between;align-items:center;border:0;border-top:.5px solid var(--line);background:none;font:inherit;font-size:15.5px;color:var(--ink);padding:14px 2px;cursor:pointer;text-align:right}
.fm-small button span:last-child{color:var(--muted);font-size:14px}
.fm-small button.r span:first-child{color:var(--k-pink)}
.fm-note{font-size:13.5px;color:var(--muted);padding:0 2px 14px;line-height:1.5}
.fm-ver{text-align:center;color:var(--ink3);font-size:12px;padding-top:12px}
/* team board */
.tw{display:flex;flex-direction:column;gap:14px;padding-top:6px}
.tw-h{display:flex;justify-content:space-between;align-items:flex-end}
.tw-h h1,.ap h1{font-size:30px;font-weight:800;letter-spacing:-.025em;margin:0}
.tw .sub,.ap .sub{font-size:13.5px;color:var(--muted)}
.wnav{display:flex;gap:6px}
.wnav button{width:36px;height:36px;border-radius:50%;border:0;background:none;color:var(--ink);display:grid;place-items:center;cursor:pointer}
.wnav button:disabled{color:var(--ink3);cursor:default}
.wnav svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tw-now{margin:0;font-size:15px;color:var(--muted)}.tw-now b{font-size:22px;color:var(--ink);font-weight:800;margin-inline-end:2px}
.wgrid{display:grid;grid-template-columns:minmax(74px,auto) repeat(5,minmax(0,1fr));column-gap:4px;font-size:12.5px;text-align:center;align-items:stretch}
.wgrid .h{color:var(--muted);font-weight:600;padding:6px 0 8px;font-size:12px}
.wgrid .h.t{color:var(--k-blue)}
.wgrid .wn{display:flex;align-items:center;gap:7px;border:0;border-top:.5px solid var(--line);background:none;font:inherit;font-weight:600;font-size:14px;color:var(--ink);padding:10px 0;cursor:pointer;text-align:right}
.wgrid .wn .av{width:26px;height:26px;font-size:11px}
.wgrid .c{border-top:.5px solid var(--line);padding:9px 0;line-height:1.3;font-variant-numeric:tabular-nums;direction:ltr;display:flex;flex-direction:column;justify-content:center;color:var(--ink)}
.wgrid .c.e{color:var(--ink3)}
.wgrid .c.t{background:rgb(6 179 229 / .1);border-radius:0}
.wgrid .h.t{background:rgb(6 179 229 / .1)}
.wgrid .c.v{color:var(--amber);font-weight:600;direction:rtl}
.wgrid .c.w{color:var(--amber)}
.tw-key{margin:0;font-size:12.5px;color:var(--ink3);text-align:center}
/* approval cards, open */
.ap{display:flex;flex-direction:column;gap:2px;padding-top:6px}
.ap .sub{margin-bottom:10px}
.rq-card{display:flex;flex-direction:column;gap:12px;padding:18px 2px;border-top:.5px solid var(--line)}
.rq-who{display:flex;align-items:center;gap:10px}.rq-who>div{flex:1;display:flex;flex-direction:column}.rq-who b{font-size:16px}.rq-who small{font-size:13px;color:var(--muted)}
.rq-what{font-size:24px;font-weight:700;letter-spacing:-.015em;display:flex;flex-direction:column;gap:3px}
.rq-what small{font-size:13.5px;font-weight:500;color:var(--muted);letter-spacing:0}
.rq-what small.q{color:var(--ink)}
.rq-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rq-btns button{height:46px;border-radius:999px;border:0;font:inherit;font-weight:700;font-size:15px;cursor:pointer}
.bs2{background:var(--sunk);color:var(--ink)}
.bp2{background:var(--k-navy);color:#fff}
:root[data-theme="dark"] .bp2{background:var(--k-blue);color:var(--k-navy)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .bp2{background:var(--k-blue);color:var(--k-navy)}}
.ap-empty{color:var(--muted);font-size:15px;padding:20px 2px;border-top:.5px solid var(--line);margin:0}
.ap-done{display:flex;flex-direction:column}
.ap-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 2px;border-top:.5px solid var(--line);font-size:14px}
/* report */
.rp{display:flex;flex-direction:column;gap:6px;padding-top:6px}
.rp-m{display:flex;align-items:center;justify-content:space-between}
.rp-m b{font-size:24px;font-weight:800;letter-spacing:-.02em}
.rp-m button{width:38px;height:38px;border:0;border-radius:50%;background:none;color:var(--ink);display:grid;place-items:center;cursor:pointer}
.rp-m svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rp-tot-old{display:flex;flex-direction:column;align-items:flex-start;padding:10px 2px 14px}
.rp-tot span{font-size:13.5px;color:var(--muted)}
.rp-tot b{font-size:44px;font-weight:800;letter-spacing:-.035em;line-height:1.05}
.rp-tot small{font-size:12px;color:var(--ink3);margin-top:4px}
.rp-p{display:flex;flex-direction:column;gap:9px;padding:15px 2px;border-top:.5px solid var(--line)}
.rp-t{display:flex;align-items:center;gap:10px}.rp-t b{flex:1;font-size:16px}
.rp-t .av{width:28px;height:28px;font-size:12px}
.rp-h{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}.rp-h i{font-style:normal;color:var(--muted);font-weight:500;font-size:14px}
.rp-bar{position:relative;height:10px;border-radius:5px;background:var(--sunk);display:flex;overflow:visible}
.rp-bar i{display:block;height:100%;background:linear-gradient(270deg,#06B3E5,#2C8FE0)}
.rp-bar i:first-child{border-radius:0 5px 5px 0}
.rp-bar i.v{background:var(--amber);border-radius:0}
.rp-bar em{position:absolute;top:-4px;bottom:-4px;width:2px;border-radius:1px;background:var(--ink);opacity:.55}
.rp-s{display:flex;gap:16px;align-items:center;font-size:12.5px;color:var(--muted)}
.rp-s b{color:var(--ink);font-size:14px;margin-inline-end:2px}
.rp-s .exp{margin-inline-start:auto}
.rp-key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--muted);padding:12px 2px;border-top:.5px solid var(--line)}
.rp-key i{display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--k-blue);margin-inline-end:6px;vertical-align:-1px}
.rp-key i.v{background:var(--amber)}.rp-key i.m{width:2px;background:var(--ink);opacity:.55}
/* person dots instead of letter circles */
.pd{display:inline-block;width:9px;height:9px;border-radius:50%;flex:none;background:#8A93A1}
.pd.s{background:#06B3E5}.pd.z{background:#2FB872}.pd.r{background:#8B5CF6}.pd.a{background:#8A93A1}
/* compact report */
.rp{gap:0}
.rp-m{padding-bottom:12px}
.rp-mt{display:flex;flex-direction:column;align-items:center;gap:1px}
.rp-mt b{font-size:22px;font-weight:800;letter-spacing:-.02em}
.rp-mt span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.rp-p{gap:7px;padding:12px 2px}
.rp-t{display:flex;align-items:center;gap:8px;border:0;background:none;font:inherit;color:var(--ink);padding:0;cursor:pointer;text-align:right;width:100%}
.rp-t b{flex:none;font-size:15px}
.rp-t .rp-s{flex:1;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-h{font-size:15px}.rp-h i{font-size:12.5px}
.rp-bar{height:6px;border-radius:3px}
.rp-bar i:first-child{border-radius:0 3px 3px 0}
.rp-bar em{top:-3px;bottom:-3px}
.rp-key{padding:10px 2px 0;font-size:11.5px}
/* sunrise slider */
.slide .sky{position:absolute;inset:0;opacity:0;pointer-events:none}
.slide .lbl{position:relative;z-index:1}
.knob,.slide.exit .knob{background:#fff;box-shadow:0 4px 14px rgb(0 32 63 / .22);z-index:2}
.knob svg,.slide.exit .knob svg{position:absolute;width:22px;height:22px;stroke:var(--kc,#00203F);fill:none;stroke-width:1.9;transition:none}
.knob{transition:box-shadow .7s cubic-bezier(.32,.72,0,1)}
.slide.arrived .knob{box-shadow:0 4px 14px rgb(0 32 63 / .22)}
/* the day's line arrives with the illustration; times settle in softly */
.mock .q.hide{opacity:0}
.mock .q.rise{animation:qrise .9s cubic-bezier(.32,.72,0,1) .35s both}
.mock .t.rise{animation:qrise .6s cubic-bezier(.32,.72,0,1) both}
@keyframes qrise{from{opacity:0;transform:translateY(6px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
/* full-screen menu grows from its button */
.fm{transform-origin:calc(100% - 40px) 40px;transform:scale(.96);filter:blur(6px);transition:opacity .32s cubic-bezier(.32,.72,0,1),transform .42s cubic-bezier(.32,.72,0,1),filter .32s cubic-bezier(.32,.72,0,1)}
.fm.show{filter:none}
@media (prefers-reduced-motion:reduce){.mock .q.rise,.mock .t.rise{animation:none}.fm{transform:none;filter:none}}
/* clock-out slides the other way */
.slide.exit .knob{right:auto;left:5px}
/* report rows line up in columns: name · counts (centred) · hours */
.rp-t{display:grid!important;grid-template-columns:auto 3.4em minmax(0,1fr) auto;gap:6px}
.rp-t .rp-s{display:grid;grid-template-columns:repeat(3,auto);justify-content:start;gap:12px;font-size:12px;color:var(--muted)}
.rp-t .rp-s b{color:var(--ink);font-size:13px;font-weight:700;margin-inline-end:2px}
.rp-bar{overflow:hidden}
.rp-bar em{top:0!important;bottom:0!important;width:2px}
.rp-h{color:var(--k-blue)!important}.rp-h i{color:var(--muted)}
.rp-note{margin:4px 2px 0;font-size:11.5px;color:var(--ink3)}
/* clock-in entrance: the tint washes up from the slider, then everything arrives in turn */
.veil.wash{animation:wash 1.1s cubic-bezier(.32,.72,0,1) both}
@keyframes wash{from{clip-path:circle(0% at 50% 92%);opacity:1}to{clip-path:circle(150% at 50% 92%);opacity:1}}
.mock.enter .t .dg{display:inline-block;animation:digit .75s cubic-bezier(.32,.72,0,1) both;animation-delay:calc(.16s + var(--i) * .05s)}
.mock.enter .t.rise{animation:none}
.mock.enter .slide{animation:sfade .45s cubic-bezier(.32,.72,0,1) both}
@keyframes sfade{from{opacity:.4}to{opacity:1}}
@keyframes arrive{from{opacity:0;transform:translateY(10px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes digit{from{opacity:0;transform:translateY(.45em) scale(.96);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){.veil.wash,.mock.enter *{animation:none!important}}
/* a slightly thicker slider */
.slide{height:66px!important}
.knob{width:56px!important;height:56px!important;top:5px!important}
.slide.exit .knob{left:5px}
/* evening tint fades over the day tint instead of jumping (a colour cannot animate into a gradient) */
.veil.out{background:transparent!important;opacity:1}
.veil::after{content:"";position:absolute;inset:0;background:var(--dusk);opacity:0;transition:opacity 1.3s cubic-bezier(.32,.72,0,1)}
.veil.out::after{opacity:1}
.veil{transition:opacity 1.1s ease,background-color 1.3s cubic-bezier(.32,.72,0,1)!important}
/* outside-the-office mark on the team board */
.wgrid .c.o{position:relative}
.od{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--k-pink);vertical-align:1px}
.wgrid .c .od{position:absolute;top:6px;left:6px}
/* NameDrop-style clock-in moment */
@property --nda{syntax:"<angle>";inherits:false;initial-value:0deg}
.nd-glow{position:fixed;inset:0;z-index:35;pointer-events:none;padding:14px;border-radius:44px;
  background:conic-gradient(from var(--nda),#06B3E5,#7B5CFF,#FA1664,#FFB547,#06B3E5);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  filter:blur(14px);animation:ndglow 1.8s cubic-bezier(.32,.72,0,1) both}
@keyframes ndglow{0%{opacity:0;--nda:0deg;padding:4px}25%{opacity:1;padding:18px}100%{opacity:0;--nda:300deg;padding:8px}}
.nd-wave{position:fixed;left:-20%;right:-20%;height:46vh;top:100%;z-index:34;pointer-events:none;
  background:radial-gradient(60% 50% at 50% 50%,rgb(255 255 255 / .55),rgb(6 179 229 / .28) 35%,rgb(123 92 255 / .16) 55%,rgb(250 22 100 / 0) 72%);
  -webkit-backdrop-filter:blur(3px) saturate(160%);backdrop-filter:blur(3px) saturate(160%);
  -webkit-mask:radial-gradient(60% 50% at 50% 50%,#000 30%,transparent 72%);mask:radial-gradient(60% 50% at 50% 50%,#000 30%,transparent 72%);
  animation:ndwave 1.15s cubic-bezier(.4,.1,.2,1) both}
@keyframes ndwave{from{transform:translateY(0);opacity:0}15%{opacity:1}to{transform:translateY(-150vh);opacity:.2}}
@keyframes ndpop{0%{scale:1;filter:none}35%{scale:1.045;filter:brightness(1.25) blur(.6px)}100%{scale:1;filter:none}}
.fixl{all:unset;cursor:pointer;display:block;margin-top:4px;min-height:24px;line-height:24px;font-size:12.5px;font-weight:500;color:var(--ink3);opacity:.8;text-align:center}
.fixl.wait{cursor:default;color:var(--k-blue);opacity:1}
[data-cell]{cursor:pointer}
/* office settings: a quiet sub-view inside the full-screen menu */
.fm-in>.fm-big,.fm-in>.fm-small,.fm-set{transition:opacity .32s cubic-bezier(.32,.72,0,1),transform .32s cubic-bezier(.32,.72,0,1)}
.fm-set{display:none;flex-direction:column;flex:1;margin-top:3vh}
.fm-in.sub>.fm-big,.fm-in.sub>.fm-small{display:none}
.fm-in.sub>.fm-set{display:flex;animation:fmsub .36s cubic-bezier(.32,.72,0,1) both}
@keyframes fmsub{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
.fm-set h2{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:14px 0 2px}
.fm-set>p{margin:0;color:var(--muted);font-size:14px}
.fm-set .fm-small{margin-top:22px}
.fm-small button em{display:block;font-style:normal;color:var(--muted);font-size:12.5px;margin-top:2px}
.fm-back{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:var(--k-blue);font-size:15px;min-height:36px}
.fm-back svg,.fm-small .chv{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.fm-small button span:last-child{display:inline-flex;align-items:center;gap:6px}
@media (prefers-reduced-motion:reduce){.fm-in.sub>.fm-set{animation:none}}
/* popups and toasts sit above the full-screen menu (z 40) */
#layer .scrim{z-index:45}.pop{z-index:46}.toast{z-index:50}
/* the light curtain canvas */
.aur{position:fixed;inset:0;width:100vw;height:100%;z-index:35;pointer-events:none}
/* manager avatars, same colors as the work board */
.av.r{background:linear-gradient(135deg,#A57BFF,#6C3BEA);color:#fff}
.av.z{background:linear-gradient(135deg,#4CC98A,#1F8A55);color:#fff}
.pop .warn{color:var(--k-pink);font-size:13.5px;min-height:1em;margin:4px 2px 0}
/* v43 design QA: one right edge for titles, lists, dot headings and numbers */
.list{margin-inline:-4px}
.list .empty{text-align:right;padding:12px 4px;margin:0}
.hd{margin:18px 0 6px}
.bal{padding:0}
.rq-card{padding:18px 0}
.ap-row{padding:12px 0}
.rp-p{padding:12px 0}
.rp-key{padding:10px 0 0}
.rp-note{margin:4px 0 0}
.drow{padding:8px 0}
.fm-small button{padding:14px 0}
.fm-note{padding:0 0 14px}
.fm-set .fm-small{margin-top:22px;padding-top:0}
/* approval card: the person dot sits on the name line */
.rq-who{align-items:flex-start}
.rq-who b{line-height:22px}
.rq-who .pd{margin-top:6.5px}
/* team board: arrows level with the title, unbroken row lines, outside-office dot clear of the time */
.tw-h{align-items:flex-start}
.tw-h h1{line-height:36px}
.wgrid{column-gap:0}
.wgrid .c .od{top:3px;left:3px}
/* menu button: the pending dot clear of the icon */
.rb.menu .mdot{top:6px;left:7px}
/* dialogs: small headings get the dot, labels stay on one line, an empty error line takes no room */
.pop .lbl2{display:flex;align-items:center;gap:8px;margin:4px 0 -4px}
.pop .lbl2::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--k-blue);flex:none}
.fld label{width:auto;min-width:92px;white-space:nowrap}
.pop .warn:empty{display:none}
textarea.note{overflow:hidden}
/* Hebrew placeholders in the left-aligned number fields read right to left */
.fld input:placeholder-shown{direction:rtl;text-align:left}
/* a wrapping subtitle keeps the X level with the title */
.kd-hd.kd-tall{align-items:flex-start}
.kd-hd.kd-tall .kd-x{margin-top:-6.4px}
/* v44: Ran's picks */
/* dark: the chosen segment in Keenest blue with navy text */
:root[data-theme="dark"] .seg button[aria-pressed="true"]{background:#06B3E5;color:#00203F;box-shadow:none}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .seg button[aria-pressed="true"]{background:#06B3E5;color:#00203F;box-shadow:none}}
/* report: a small chevron that turns when the day detail opens */
.rp-t{grid-template-columns:auto 3.4em minmax(0,1fr) auto auto!important}
.rp-chv{width:11px;height:11px;fill:none;stroke:var(--ink3);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .45s cubic-bezier(.32,.72,0,1)}
.rp-t.open .rp-chv{transform:rotate(-90deg)}
@media (prefers-reduced-motion:reduce){.rp-chv{transition:none}}
/* report day rows: full date, clock times regular, hours worked bold; only the note gives way */
.rp-p .drow{grid-template-columns:auto minmax(0,1fr) auto}
.rp-p .drow .dd{white-space:nowrap;font-variant-numeric:tabular-nums}
.rp-p .drow .tt{font-weight:400;white-space:nowrap}
.rp-p .drow .tt b{font-weight:700}
/* today on a vacation or sick day: a quiet line in place of the slider */
.vq{height:66px;margin-bottom:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:16px;color:var(--muted)}
.vq button{all:unset;cursor:pointer;font-size:13px;font-weight:500;color:var(--accent-text);padding:2px 8px}
.slide[hidden]{display:none!important}
/* today: the toast sits above the slider */
body:has(#view .mock) .toast{bottom:calc(106px + env(safe-area-inset-bottom,0px))}
/* special-day drawings stay clear of the slider: the canvas fades out softly towards the slider (clear in the bottom 140px, faint at 180px) */
#cv{-webkit-mask-image:linear-gradient(to top,transparent calc(140px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .15) calc(180px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .5) calc(225px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .85) calc(270px + env(safe-area-inset-bottom,0px)),#000 calc(305px + env(safe-area-inset-bottom,0px)));mask-image:linear-gradient(to top,transparent calc(140px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .15) calc(180px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .5) calc(225px + env(safe-area-inset-bottom,0px)),rgb(0 0 0 / .85) calc(270px + env(safe-area-inset-bottom,0px)),#000 calc(305px + env(safe-area-inset-bottom,0px)))}
'''
pwa='''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>שעון נוכחות קינסט</title>
<link rel="manifest" href="manifest.webmanifest?v=34">
<link rel="apple-touch-icon" href="icons/clock-apple-180.png?v=34">
<link rel="icon" type="image/png" href="icons/clock-192.png?v=34">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="נוכחות">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#E6E9EC" id="tcolor">'''
body=open(C+'body.html').read()
parts=[pwa,'\n'.join(head),'<style>',open(C+'motion.css').read(),open(C+'dialog.css').read(),extra_css,'</style>','</head>','<body>',body,
 '<script>'+open(C+'engine.js').read()+'</script>',
 '<script src="supabase.js"></script>',
 '<script>'+core+'</script>',
 '<script>'+open(C+'live.js').read()+'</script>',
 '<script>'+open(C+'dialog.js').read()+'</script>',
 '<script>'+open(C+'motion.js').read()+'</script>','</body>','</html>']
open(O+'index.html','w').write('\n'.join(parts))
