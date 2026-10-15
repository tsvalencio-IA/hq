#!/usr/bin/env python3
"""Build Android/PWA icon solely from the four APPROVED mascot views.
No character is regenerated, recolored, redrawn or replaced.
Source: 3d/mascotes_aprovados.webp.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "3d" / "mascotes_aprovados.webp"
DEST = ROOT / "3d" / "icons"
DEST.mkdir(parents=True, exist_ok=True)
im = Image.open(SOURCE).convert("RGB")
W, H = im.size
S = 1024

def src_rect(coords):
    x1, y1, x2, y2 = coords
    return (round(x1 * W / 1448), round(y1 * H / 1088),
            round(x2 * W / 1448), round(y2 * H / 1088))

def font(size, bold=True):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ] if bold else ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def paint_icon():
    bg = Image.new("RGB", (S, S))
    px = bg.load()
    for y in range(S):
        for x in range(S):
            # Deep indigo sky with gentle blue center glow.
            glow = max(0.0, 1.0 - ((x-512)**2 / 600**2 + (y-420)**2 / 660**2))
            px[x,y] = (round(5 + 15 * glow), round(19 + 38 * glow), round(45 + 67 * glow))
    bg = bg.convert("RGBA")
    d = ImageDraw.Draw(bg, "RGBA")
    d.rounded_rectangle((15, 15, 1009, 1009), radius=205,
                        outline=(73, 210, 255, 255), width=24)
    d.rounded_rectangle((37, 37, 987, 987), radius=182,
                        outline=(117, 225, 255, 120), width=5)
    # Original approved reference positions, always front-facing only:
    # Thiago, Thamis, Luna, Liz. Edges stay within each character's panel.
    mascots = [
        ("Thiago", (46, 205, 171, 424), (287, 278), 206, (61, 200, 255)),
        ("Thamis", (753, 202, 892, 429), (737, 278), 206, (255, 145, 79)),
        ("Luna",   (27, 811, 178, 949), (287, 684), 203, (255, 212, 123)),
        ("Liz",    (742, 808, 903, 952), (737, 684), 203, (200, 132, 255)),
    ]
    for name, rect, (cx,cy), radius, accent in mascots:
        box = src_rect(rect)
        crop = im.crop(box)
        diameter = 2*radius
        portrait = ImageOps.fit(crop, (diameter,diameter), Image.Resampling.LANCZOS,
                                centering=(.5, .39)).convert("RGBA")
        matte = Image.new("L", (diameter,diameter), 0)
        m = ImageDraw.Draw(matte)
        m.ellipse((3,3,diameter-4,diameter-4), fill=255)
        shadow = Image.new("RGBA", (S,S), (0,0,0,0))
        sd=ImageDraw.Draw(shadow)
        sd.ellipse((cx-radius-9,cy-radius+16,cx+radius+9,cy+radius+34),
                   fill=(0,0,0,135))
        shadow=shadow.filter(ImageFilter.GaussianBlur(16))
        bg.alpha_composite(shadow)
        bg.paste(portrait, (cx-radius,cy-radius), matte)
        d = ImageDraw.Draw(bg,"RGBA")
        for j in range(10):
            alpha = round(165*(1-j/11))
            d.ellipse((cx-radius+j,cy-radius+j,cx+radius-j,cy+radius-j),
                      outline=(*accent,alpha), width=2)
        # Name is unobtrusive; approved mascot face remains visible.
        f = font(24)
        label=name.upper()
        bx=d.textbbox((0,0),label,font=f,stroke_width=0)
        width=bx[2]-bx[0]
        bottom=cy+radius-31
        d.rounded_rectangle((cx-width/2-16,bottom-6,cx+width/2+16,bottom+30),
                            radius=15,fill=(3,20,44,194))
        d.text((cx,bottom+10),label,fill=(255,255,255,255),font=f,anchor="mm")
    # Tiny golden star separates upper characters; not a new character.
    d=ImageDraw.Draw(bg,"RGBA")
    d.ellipse((484,444,540,500), fill=(255,198,79,250))
    d.text((512,469),"★",font=font(35),fill=(17,47,78,255),anchor="mm")
    # The brand name is legible in a phone launcher, without hiding faces.
    d.rounded_rectangle((110,862,914,995),radius=53,fill=(5,27,64,248),
                        outline=(51,189,249,255),width=9)
    d.text((510,891),"UNIVERSO",font=font(28),fill=(238,246,255,255),anchor="mm")
    d.text((488,946),"thIAguinho",font=font(74),
           fill=(249,253,255,255),stroke_width=4,stroke_fill=(10,102,183,255),
           anchor="mm")
    d.rounded_rectangle((824,912,925,979),radius=18,fill=(255,204,69,255))
    d.text((873,943),"3D",font=font(45),
           fill=(8,47,89,255),anchor="mm")
    return bg

app_icon=paint_icon()
def png_icon(size,maskable=False):
    art=app_icon
    if maskable:
        # The actual faces/logo stay inside Android's safe area.
        backdrop=Image.new("RGBA",art.size,(7,25,55,255))
        inset=round(S*.82)
        scaled=art.resize((inset,inset),Image.Resampling.LANCZOS)
        backdrop.alpha_composite(scaled,((S-inset)//2,(S-inset)//2))
        art=backdrop
    return art.resize((size,size),Image.Resampling.LANCZOS).convert("RGB")

targets=[("mascotes-reais-192.png",192,False),
         ("mascotes-reais-512.png",512,False),
         ("mascotes-reais-maskable-512.png",512,True)]
for filename,size,maskable in targets:
    out=DEST/filename
    png_icon(size,maskable).save(out,"PNG",optimize=True)
    print(f"{filename}: {size}x{size} {out.stat().st_size} bytes")
