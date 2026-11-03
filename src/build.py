import re,os
import os
S=os.path.dirname(os.path.abspath(__file__))+'/../'
C=S+'src/';O=S+''
head=open(C+'head.html').read().split('\n')
head=[l for l in head if 'claude:viewport-fit-sides' not in l and not l.startswith('<title>')]
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
.mock .hi{margin-top:30px;font-size:15px;font-weight:600;color:var(--ink)}
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
.slide .orb{position:absolute;left:50%;bottom:-18px;width:38px;height:38px;margin-left:-19px;border-radius:50%;opacity:0;pointer-events:none;background:radial-gradient(circle,#fff 0%,#FFD9E8 30%,rgb(250 22 100 / .55) 55%,rgb(250 22 100 / 0) 72%)}
.slide .lbl{position:relative;z-index:1}
.knob,.slide.exit .knob{background:#fff;box-shadow:0 4px 14px rgb(0 32 63 / .22);z-index:2}
.knob svg,.slide.exit .knob svg{position:absolute;width:22px;height:22px;stroke:var(--kc,#00203F);fill:none;stroke-width:1.9;transition:none}
.slide.arrived .knob{box-shadow:0 0 0 6px rgb(255 255 255 / .25),0 4px 14px rgb(0 32 63 / .22)}
/* manager avatars, same colors as the work board */
.av.r{background:linear-gradient(135deg,#A57BFF,#6C3BEA);color:#fff}
.av.z{background:linear-gradient(135deg,#4CC98A,#1F8A55);color:#fff}
.pop .warn{color:var(--k-pink);font-size:13.5px;min-height:1em;margin:4px 2px 0}
'''
pwa='''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>שעון נוכחות קינסט</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="icons/icon-192.png">
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
