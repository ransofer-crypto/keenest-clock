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
/* home-screen app: the page sits under the status bar, so the backdrop must reach the bottom edge too */
#cv,.veil{bottom:auto;height:calc(100% + env(safe-area-inset-top,0px))}
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
