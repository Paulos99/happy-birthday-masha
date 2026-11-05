import os,glob,datetime,re
from PIL import Image,ImageOps
D='/cursor/stores/store-696250ab-14ba-4adf-a040-317f69b36d85/grok-bot/agents/e3058129-ec26-4848-a42d-7e45a0b9cff1/attachments/'
cut=datetime.datetime(2026,11,5,18,5).timestamp()
try:
    import pillow_heif; pillow_heif.register_heif_opener()
except Exception as e: print('no heif',e)
fs=sorted([f for f in glob.glob(D+'*') if f.lower().endswith(('.jpg','.jpeg','.png','.heic')) and os.path.getmtime(f)>=cut],key=os.path.getmtime)
os.makedirs('photos',exist_ok=True)
for f in glob.glob('photos/*.jpg'): os.remove(f)
out=[]
for i,f in enumerate(fs,1):
    try:
        im=Image.open(f); im=ImageOps.exif_transpose(im)
        if im.mode in('RGBA','LA','P'):
            im=im.convert('RGBA'); bg=Image.new('RGB',im.size,(255,255,255)); bg.paste(im,mask=im.split()[-1]); im=bg
        else: im=im.convert('RGB')
        im.thumbnail((1200,1200),Image.LANCZOS)
        p=f'photos/{i:02d}.jpg'; im.save(p,'JPEG',quality=82,optimize=True)  # no exif passed
        out.append(p); print(os.path.basename(f),im.size,os.path.getsize(p))
    except Exception as e: print('FAIL',f,e)
s=open('photos.js').read()
a=s.index('window.PHOTOS')
s=s[:a]+'window.PHOTOS = [\n'+''.join(f"  '{p}',\n" for p in out)+'];\n'
open('photos.js','w').write(s)
print(len(out))
