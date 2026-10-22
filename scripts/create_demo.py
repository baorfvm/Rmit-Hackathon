"""Create a silent two-minute submission video with on-screen demo narration."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

W, H, FPS = 1280, 720, 10
EGG, CLOUD, PAPER, GRAPHITE, QUIET, BLUE = '#fdfcfb', '#f7f7f7', '#f0f0ea', '#2e2e2e', '#6a6972', '#207dff'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def wrap(draw, text, f, width):
    words, lines, line = text.split(), [], ''
    for word in words:
        trial = f'{line} {word}'.strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= width: line = trial
        else: lines.append(line); line = word
    if line: lines.append(line)
    return lines

def text_block(draw, text, xy, f, color, width, spacing=10):
    x, y = xy
    for line in wrap(draw, text, f, width):
        draw.text((x, y), line, font=f, fill=color)
        y += f.size + spacing
    return y

slides = [
    (0, 15, 'THE POSSIBILITY', 'Municipal CCTV access without a master key.', 'CivicShield lets useful authority appear for one justified request - without giving any administrator, cloud, or vendor unilateral power over the city.'),
    (15, 38, 'SCENARIO 01 - STANDARD ACCESS', 'Identity. Purpose. Scope. Time.', 'Maya requests Zone A under incident INC-2026-001. OIDC identity, the camera ACL, the ticket, and the DPoP device proof align. A 15-minute key is issued only to her device.'),
    (38, 58, 'SCENARIO 02 - OUT OF SCOPE', 'A valid login is not a master key.', 'The same verified operator requests restricted Zone B. The scoped ACL fails. Tide authority releases no key, and the denial becomes a sealed audit event.'),
    (58, 92, 'SCENARIO 03 - ADMIN OVERRIDE', 'No administrator can act alone.', 'A system administrator attempts Force Unlock All Cameras. The request is captured, not executed. One approval remains blocked. At two independent approvals, authority emerges for one scoped action.'),
    (92, 108, 'ACCOUNTABILITY', 'Every decision leaves a receipt.', 'Requests, denials, signatures, issued keys, and viewing windows form a tamper-evident chain. An attempted override cannot disappear inside an admin console.'),
    (108, 120, 'WHAT CHANGES', 'Protect the city. Protect the people in it.', 'With TideCloak, public safety no longer depends on whoever holds the master password. The server stores video - but never holds the power to reveal it.'),
]

def frame_at(t):
    slide = next(s for s in slides if s[0] <= t < s[1])
    start, end, label, title, body = slide
    p = (t - start) / (end - start)
    im = Image.new('RGB', (W, H), EGG)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 70), fill=EGG)
    d.line((0, 69, W, 69), fill='#e9e5df', width=1)
    d.rectangle((38, 24, 48, 47), fill=GRAPHITE)
    d.text((62, 24), 'CivicShield', font=font(22, True), fill=GRAPHITE)
    d.text((1010, 27), 'RMIT UNLOCKED  /  2026', font=font(12, True), fill=QUIET)
    d.rounded_rectangle((72, 120, 1208, 626), radius=18, fill=CLOUD)
    d.rounded_rectangle((106, 158, 720, 586), radius=14, fill=EGG, outline='#e4ded3')
    d.text((146, 201), label, font=font(13, True), fill=BLUE)
    y = text_block(d, title, (146, 246), font(44, True), GRAPHITE, 520, 8)
    text_block(d, body, (146, y + 24), font(21), QUIET, 505, 10)
    # Trust-flow visual panel
    d.rounded_rectangle((748, 158, 1174, 586), radius=14, fill=PAPER)
    nodes = [('CAMERA EDGE', 'Encrypted'), ('BLIND VAULT', 'Ciphertext'), ('TIDE AUTHORITY', 'Policy + quorum'), ('BOUND DEVICE', '15-minute key')]
    for i, (a, b) in enumerate(nodes):
        yy = 198 + i * 90
        active = min(3, int(p * 4.2)) >= i
        color = BLUE if active else '#b8b5ae'
        d.ellipse((784, yy, 818, yy + 34), fill=color)
        d.text((796, yy + 7), str(i + 1), font=font(13, True), fill='white')
        d.text((838, yy), a, font=font(13, True), fill=GRAPHITE)
        d.text((838, yy + 23), b, font=font(15), fill=QUIET)
        if i < 3: d.line((801, yy + 36, 801, yy + 84), fill='#d6d1c8', width=2)
    # Progress
    d.line((72, 667, 1208, 667), fill='#e4ded3', width=4)
    d.line((72, 667, 72 + int(1136 * t / 120), 667), fill=BLUE, width=4)
    d.text((72, 681), f'{int(t)//60}:{int(t)%60:02d}', font=font(12), fill=QUIET)
    d.text((1168, 681), '2:00', font=font(12), fill=QUIET)
    return im

out = Path('demo.mp4')
writer = imageio_ffmpeg.write_frames(str(out), (W, H), fps=FPS, codec='libx264', pix_fmt_out='yuv420p', output_params=['-crf', '27', '-preset', 'veryfast', '-movflags', '+faststart'])
writer.send(None)
for n in range(120 * FPS):
    writer.send(frame_at(n / FPS).tobytes())
writer.close()
print(out.resolve(), out.stat().st_size)
