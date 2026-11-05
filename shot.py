import sys, asyncio
from playwright.sync_api import sync_playwright
out=sys.argv[1] if len(sys.argv)>1 else 'scene_shot.png'
t=float(sys.argv[2]) if len(sys.argv)>2 else 3000
with sync_playwright() as p:
    b=p.chromium.launch(args=['--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':1920,'height':1080})
    msgs=[]
    pg.on('console',lambda m:msgs.append(m.text)); pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
    pg.goto('file:///workspace/bday-scene/scene.html?manual&norelight')
    pg.wait_for_function('window.Scene && Scene.svg.children.length>5',timeout=15000)
    pg.wait_for_timeout(800)
    pg.evaluate(f'Scene.paintGreeting("С днём рождения, Маша",4000); Scene.step(0); Scene.step({t})')
    pg.evaluate(f'Scene.step({t})')
    pg.wait_for_timeout(300)
    pg.screenshot(path=out)
    print(msgs)
    b.close()
