import sys, os, subprocess, shutil
from playwright.sync_api import sync_playwright
FPS=12; DUR=6.0
os.makedirs('_t/frames',exist_ok=True)
for f in os.listdir('_t/frames'): os.remove('_t/frames/'+f)
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1920,'height':1080})
    pg.goto('file:///workspace/bday-scene/scene.html?manual&norelight')
    pg.wait_for_function('window.Scene && Scene.svg.children.length>5')
    pg.wait_for_timeout(800)
    pg.evaluate('Scene.step(0)')
    # warm up snow so it is already falling
    N=int(FPS*DUR)
    T0=8000  # start at 8s of scene time
    pg.evaluate(f'Scene.step({T0-100})')
    pg.evaluate('Scene.paintGreeting("С днём рождения, Маша",4200)')
    for i in range(N):
        t=T0+i*1000/FPS
        if i==int(FPS*1.2): pg.evaluate('Scene.snowBurst(1700,830,70,-1)')
        pg.evaluate(f'''(()=>{{Scene.step({t}); document.getAnimations().forEach(a=>{{a.pause();a.currentTime={t};}});}})()''')
        pg.screenshot(path=f'_t/frames/f{i:03d}.png')
        if i==N-1: shutil.copy(f'_t/frames/f{i:03d}.png','scene_preview.png')
    b.close()
