#!/usr/bin/env python3
"""
Generate favicon.ico without external dependencies.
Creates a 32x32 RGBA ICO with the EB monogram in emerald on dark.
"""
import struct
import os

SIZE = 32
BG = (11, 11, 13, 255)       # #09090b zinc-950
EDGE = (16, 185, 129, 255)    # #10b981 emerald-500
FG = (250, 250, 250, 255)     # #fafafa
ACCENT = (167, 243, 208, 255) # #a7f3d0 emerald-200

def in_rounded_rect(x, y, w, h, r):
    if x < r and y < r and (r - x) ** 2 + (r - y) ** 2 > r * r:
        return False
    if x >= w - r and y < r and (x - (w - r - 1)) ** 2 + (r - y) ** 2 > r * r:
        return False
    if x < r and y >= h - r and (r - x) ** 2 + (y - (h - r - 1)) ** 2 > r * r:
        return False
    if x >= w - r and y >= h - r and (x - (w - r - 1)) ** 2 + (y - (h - r - 1)) ** 2 > r * r:
        return False
    return True

def in_outer_frame(x, y, w, h, inset=1, r=6):
    return (x >= inset and y >= inset and x < w - inset and y < h - inset
            and in_rounded_rect(x - inset, y - inset, w - inset * 2, h - inset * 2, r - inset))

def draw_E(x, y, w, h, thick=4):
    """Return set of (x,y) pixels for a stylized E glyph."""
    pts = set()
    # vertical bar
    for i in range(thick):
        for j in range(h):
            pts.add((x + i, y + j))
    # top bar
    for i in range(w):
        for j in range(thick):
            pts.add((x + i, y + j))
    # middle bar
    mid_y = y + h // 2 - thick // 2
    for i in range(int(w * 0.75)):
        for j in range(thick):
            pts.add((x + i, mid_y + j))
    # bottom bar
    for i in range(w):
        for j in range(thick):
            pts.add((x + i, y + h - thick + j))
    return pts

def draw_dot(x, y, r):
    pts = set()
    for i in range(-r, r + 1):
        for j in range(-r, r + 1):
            if i * i + j * j <= r * r:
                pts.add((x + i, y + j))
    return pts

def make_image(size):
    pixels = [[BG for _ in range(size)] for _ in range(size)]

    # outer rounded frame (inset 1px)
    for y in range(size):
        for x in range(size):
            if in_outer_frame(x, y, size, size):
                pixels[y][x] = EDGE

    # EB glyph: "E" on left + "B" implied by accent dot top-right
    e_pixels = draw_E(7, 9, 12, 14, thick=3)
    for (x, y) in e_pixels:
        if 0 <= x < size and 0 <= y < size:
            pixels[y][x] = FG

    # Accent dot (top-right) representing the "B" / status
    dot = draw_dot(size - 6, 6, 2)
    for (x, y) in dot:
        if 0 <= x < size and 0 <= y < size:
            pixels[y][x] = ACCENT

    return pixels

def encode_bmp(pixels, size):
    """Encode as 32-bit BMP inside ICO. ICO BMP is bottom-up."""
    # BITMAPINFOHEADER (40 bytes)
    header = struct.pack(
        '<IiiHHIIiiII',
        40,             # biSize
        size,           # biWidth
        size * 2,       # biHeight (doubled for AND mask in ICO)
        1,              # biPlanes
        32,             # biBitCount
        0,              # biCompression (BI_RGB)
        0,              # biSizeImage
        0,              # biXPelsPerMeter
        0,              # biYPelsPerMeter
        0,              # biClrUsed
        0,              # biClrImportant
    )

    # XOR mask (pixel data) - bottom-up, BGRA
    xor_data = bytearray()
    for y in range(size - 1, -1, -1):
        for x in range(size):
            r, g, b, a = pixels[y][x]
            xor_data += struct.pack('BBBB', b, g, r, a)

    # AND mask (1 bit per pixel, 0 = opaque). Row stride padded to 4 bytes.
    row_bytes = ((size + 31) // 32) * 4
    and_data = bytearray()
    for y in range(size - 1, -1, -1):
        row = bytearray(row_bytes)
        for x in range(size):
            r, g, b, a = pixels[y][x]
            if a == 0:
                byte_idx = x // 8
                bit_idx = 7 - (x % 8)
                row[byte_idx] |= (1 << bit_idx)
        and_data += row

    return header + bytes(xor_data) + bytes(and_data)

def main():
    pixels = make_image(SIZE)
    img_data = encode_bmp(pixels, SIZE)

    # ICONDIR (6 bytes)
    icondir = struct.pack('<HHH', 0, 1, 1)
    # ICONDIRENTRY (16 bytes)
    offset = 6 + 16
    entry = struct.pack(
        '<BBBBHHII',
        SIZE if SIZE < 256 else 0,    # width
        SIZE if SIZE < 256 else 0,    # height
        0,                            # color count
        0,                            # reserved
        1,                            # planes
        32,                           # bit count
        len(img_data),                # bytes in resource
        offset,                       # offset
    )

    out_path = os.path.join(os.path.dirname(__file__), '..', 'favicon.ico')
    out_path = os.path.abspath(out_path)
    with open(out_path, 'wb') as f:
        f.write(icondir + entry + img_data)
    print(f"Wrote {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == '__main__':
    main()