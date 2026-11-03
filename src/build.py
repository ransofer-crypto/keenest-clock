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
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#E6E9EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#171717" media="(prefers-color-scheme: dark)">'''
body=open(C+'body.html').read().replace('הדמיה · <span id="demoWho">שלו</span>','<span id="demoWho"></span>')
parts=[pwa,'\n'.join(head),'<style>',open(C+'motion.css').read(),open(C+'dialog.css').read(),extra_css,'</style>','</head>','<body>',body,
 '<script>'+open(C+'engine.js').read()+'</script>',
 '<script src="supabase.js"></script>',
 '<script>'+core+'</script>',
 '<script>'+open(C+'live.js').read()+'</script>',
 '<script>'+open(C+'dialog.js').read()+'</script>',
 '<script>'+open(C+'motion.js').read()+'</script>','</body>','</html>']
open(O+'index.html','w').write('\n'.join(parts))
