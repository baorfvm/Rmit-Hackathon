"""Build the captioned two-minute demo from verified CivicShield UI captures."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

W, H, FPS = 1280, 720, 10
QUIET, BLUE = '#dadada', '#6da7ff'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def cover(image):
    scale = max(W / image.width, H / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    image = image.resize(size, Image.Resampling.LANCZOS)
    x, y = (size[0] - W) // 2, (size[1] - H) // 2
    return image.crop((x, y, x + W, y + H))

segments = [
    (12, 'tmp-hero.png', '01  THE POSSIBILITY', 'Useful municipal CCTV access without a master key.', 'CivicShield protects public safety without giving an administrator, cloud, or vendor unilateral power over the city.'),
    (12, 'tmp-architecture.png', '02  THE TRUST CONSTRAINT', 'One privileged account can expose everyone.', 'Conventional systems keep reusable authority in the backend. TideCloak keeps cryptographic authority outside any one server.'),
    (14, 'tmp-standard.png', '03  STANDARD REQUEST', 'Identity, purpose, scope, and time must align.', 'Maya presents an OIDC identity, incident ticket, Zone A ACL, time window, and DPoP device proof.'),
    (15, 'tmp-granted.png', '04  POLICY-APPROVED ACCESS', 'One camera. One device. Fifteen minutes.', 'TideCloak releases an ephemeral, device-bound key. Decryption happens locally; the cloud keeps only ciphertext.'),
    (10, 'tmp-denied.png', '05  OUT-OF-SCOPE DENIAL', 'A valid login is not a master key.', 'The same operator requests restricted Zone B. The ACL fails, no key is released, and the denial becomes evidence.'),
    (10, 'tmp-quorum0.png', '06  THE GOD-MODE TEST', 'The requesting administrator is denied.', 'They cannot approve their own override. Two other admins must approve from their separate TideCloak sessions.'),
    (10, 'tmp-quorum1.png', '07  ONE REMOTE APPROVAL', 'The requesting admin is still blocked.', 'The Security Director approves from another device, but one signature does not meet the 2-of-3 threshold.'),
    (8, 'tmp-quorum2.png', '08  SECOND ADMIN APPROVES', 'Civil Oversight completes the quorum.', 'Only after another admin independently approves from their own session can one scoped unlock proceed.'),
    (10, 'tmp-quorum-granted.png', '09  SCOPED UNLOCK', 'The quorum issues one temporary Zone B key.', 'The key is sealed to the approved context and device. Every approval and release is recorded.'),
    (10, 'tmp-audit.png', '10  ACCOUNTABILITY', 'Every decision leaves a verifiable receipt.', 'Approvals, denials, issued keys, and viewing windows form a tamper-evident chain. Override attempts cannot disappear.'),
    (9, 'tmp-closing.png', '11  WHAT CHANGES', 'Protect the city. Protect the people in it.', 'With TideCloak, public safety no longer depends on blindly trusting whoever holds the master password.'),
]

assert sum(s[0] for s in segments) == 120
loaded = {name: cover(Image.open(name).convert('RGB')) for _, name, *_ in segments}

def frame(image, label, title, copy, local_p, global_t):
    zoom = 1 + .012 * local_p
    zw, zh = round(W * zoom), round(H * zoom)
    moving = image.resize((zw, zh), Image.Resampling.LANCZOS)
    x = round((zw - W) * (.25 + .5 * local_p))
    y = round((zh - H) * .45)
    canvas = moving.crop((x, y, x + W, y + H)).convert('RGBA')
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rounded_rectangle((54, 535, 1226, 690), radius=14, fill=(38, 38, 38, 242))
    d.text((82, 558), label, font=font(13, True), fill=BLUE)
    d.text((82, 584), title, font=font(25, True), fill='white')
    d.text((82, 625), copy, font=font(15), fill=QUIET)
    d.line((82, 670, 1198, 670), fill=(255, 255, 255, 45), width=3)
    d.line((82, 670, 82 + int(1116 * global_t / 120), 670), fill=BLUE, width=3)
    d.text((1138, 548), f'{int(global_t)//60}:{int(global_t)%60:02d}', font=font(12, True), fill=(255,255,255,180))
    return Image.alpha_composite(canvas, overlay).convert('RGB')

out = Path('demo.mp4')
writer = imageio_ffmpeg.write_frames(str(out), (W, H), fps=FPS, codec='libx264', pix_fmt_out='yuv420p', output_params=['-crf', '23', '-preset', 'veryfast', '-movflags', '+faststart'])
writer.send(None)
elapsed = 0
for duration, name, label, title, copy in segments:
    for n in range(duration * FPS):
        t = elapsed + n / FPS
        writer.send(frame(loaded[name], label, title, copy, n / (duration * FPS), t).tobytes())
    elapsed += duration
writer.close()
print(out.resolve(), out.stat().st_size)
