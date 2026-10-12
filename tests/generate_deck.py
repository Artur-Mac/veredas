#!/usr/bin/env python3
"""
VEREDA Deck Orchestrator & Exporter
Canonical Source of Truth: docs/pitch/deck_slides_v2.html

This script:
1. Validates the canonical HTML presentation (docs/pitch/deck_slides_v2.html).
2. Renders high-resolution screenshot previews for each slide via headless Firefox.
3. Builds the verified multi-page PDF (docs/pitch/deck_slides_v2.pdf).
4. Generates the panoramic contact sheet (docs/pitch/slide_contact_sheet.png).
"""

import os
import re
import sys
import struct
import zlib
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANONICAL_DECK = os.path.join(BASE_DIR, "docs", "pitch", "deck_slides_v2.html")
PREVIEWS_DIR = os.path.join(BASE_DIR, "docs", "pitch", "previews")
OUTPUT_PDF = os.path.join(BASE_DIR, "docs", "pitch", "deck_slides_v2.pdf")
CONTACT_SHEET_HTML = os.path.join(BASE_DIR, "docs", "pitch", "contact_sheet.html")
CONTACT_SHEET_PNG = os.path.join(BASE_DIR, "docs", "pitch", "slide_contact_sheet.png")

def unfilter_png(data, width, height, bpp):
    stride = width * bpp
    raw = bytearray(height * stride)
    src_pos = dst_pos = 0
    prev_row = bytearray(stride)
    for y in range(height):
        filter_type = data[src_pos]
        src_pos += 1
        curr_row = bytearray(data[src_pos : src_pos + stride])
        src_pos += stride
        if filter_type == 1:
            for x in range(bpp, stride):
                curr_row[x] = (curr_row[x] + curr_row[x - bpp]) & 0xff
        elif filter_type == 2:
            for x in range(stride):
                curr_row[x] = (curr_row[x] + prev_row[x]) & 0xff
        elif filter_type == 3:
            for x in range(stride):
                left = curr_row[x - bpp] if x >= bpp else 0
                up = prev_row[x]
                curr_row[x] = (curr_row[x] + ((left + up) >> 1)) & 0xff
        elif filter_type == 4:
            for x in range(stride):
                a = curr_row[x - bpp] if x >= bpp else 0
                b = prev_row[x]
                c = prev_row[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa = abs(p - a); pb = abs(p - b); pc = abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                curr_row[x] = (curr_row[x] + pr) & 0xff
        raw[dst_pos : dst_pos + stride] = curr_row
        prev_row = curr_row
        dst_pos += stride
    return raw

def parse_png(path):
    with open(path, 'rb') as f: content = f.read()
    pos = 8
    width = height = color_type = 0
    idat_parts = []
    while pos < len(content):
        length, chunk_type = struct.unpack('>I4s', content[pos:pos+8])
        pos += 8
        chunk_data = content[pos:pos+length]
        pos += length + 4
        if chunk_type == b'IHDR':
            width, height, bit_depth, color_type = struct.unpack('>IIBB', chunk_data[:10])
        elif chunk_type == b'IDAT':
            idat_parts.append(chunk_data)
        elif chunk_type == b'IEND':
            break
    decompressed = zlib.decompress(b''.join(idat_parts))
    bpp = 4 if color_type == 6 else 3
    raw_pixels = unfilter_png(decompressed, width, height, bpp)
    if bpp == 4:
        rgb = bytearray(width * height * 3)
        for i in range(width * height):
            rgb[i*3 : i*3+3] = raw_pixels[i*4 : i*4+3]
        return width, height, bytes(rgb)
    return width, height, bytes(raw_pixels)

def compile_pdf(images, out_pdf):
    n_pages = len(images)
    objects = []
    page_objs = [5 + i*3 for i in range(n_pages)]
    
    objects.append(b'<< /Type /Catalog /Pages 2 0 R >>')
    kids_str = ' '.join(f'{p} 0 R' for p in page_objs)
    objects.append(f'<< /Type /Pages /Kids [{kids_str}] /Count {n_pages} >>'.encode())
    
    for i, img_path in enumerate(images):
        w, h, rgb = parse_png(img_path)
        comp_data = zlib.compress(rgb)
        
        img_dict = (
            f'<< /Type /XObject /Subtype /Image /Width {w} /Height {h} '
            f'/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode '
            f'/Length {len(comp_data)} >>\nstream\n'
        ).encode() + comp_data + b'\nendstream'
        objects.append(img_dict)
        
        content_ops = f'q {w} 0 0 {h} 0 0 cm /Im{i+1} Do Q\n'.encode()
        content_obj = f'<< /Length {len(content_ops)} >>\nstream\n'.encode() + content_ops + b'endstream'
        objects.append(content_obj)
        
        img_obj_id = 3 + i*3
        content_obj_id = 4 + i*3
        page_dict = (
            f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] '
            f'/Contents {content_obj_id} 0 R '
            f'/Resources << /XObject << /Im{i+1} {img_obj_id} 0 R >> >> >>'
        ).encode()
        objects.append(page_dict)
        
    out = bytearray(b'%PDF-1.4\n')
    xref = [0]
    for i, obj in enumerate(objects):
        xref.append(len(out))
        out.extend(f'{i+1} 0 obj\n'.encode() + obj + b'\nendobj\n')
        
    startxref = len(out)
    out.extend(f'xref\n0 {len(objects)+1}\n0000000000 65535 f \n'.encode())
    for offset in xref[1:]:
        out.extend(f'{offset:010d} 00000 n \n'.encode())
    out.extend(f'trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{startxref}\n%%EOF\n'.encode())
    
    with open(out_pdf, 'wb') as f:
        f.write(out)
    print(f"Generated PDF: {out_pdf} ({len(out)} bytes, {n_pages} pages)")

def main():
    print("=" * 60)
    print("VEREDA PRESENTATION PIPELINE — CANONICAL v2")
    print("=" * 60)

    if not os.path.exists(CANONICAL_DECK):
        print(f"Error: Canonical presentation not found: {CANONICAL_DECK}")
        sys.exit(1)

    with open(CANONICAL_DECK, "r", encoding="utf-8") as f:
        html = f.read()

    slides = re.findall(r'<section\s+class=\"[^\"]*\"\s+id=\"slide-(\d+)\">', html)
    print(f"Found {len(slides)} slides in canonical source: {CANONICAL_DECK}")

    os.makedirs(PREVIEWS_DIR, exist_ok=True)
    images = []

    for i in range(1, len(slides) + 1):
        html_mod = re.sub(
            r'<section\s+class=\"[^\"]*\"\s+id=\"slide-(\d+)\">',
            lambda m: f'<section class=\"slide active\" id=\"slide-{m.group(1)}\">' if int(m.group(1)) == i else f'<section class=\"slide\" id=\"slide-{m.group(1)}\">',
            html
        )
        html_mod = html_mod.replace('let currentSlide = 1;', f'let currentSlide = {i};')
        
        tmp_path = f"/tmp/render_slide_{i}.html"
        with open(tmp_path, "w", encoding="utf-8") as tmp_f:
            tmp_f.write(html_mod)
        
        out_img = os.path.join(PREVIEWS_DIR, f"slide_{i:02d}.png")
        cmd = [
            "firefox", "--headless",
            "--screenshot", out_img,
            "--window-size", "1240,740",
            f"file://{tmp_path}"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        images.append(out_img)
        print(f"Rendered Slide {i:02d}: {out_img} ({os.path.getsize(out_img)} bytes)")

    # Compile PDF
    compile_pdf(images, OUTPUT_PDF)

    # Render Contact Sheet
    if os.path.exists(CONTACT_SHEET_HTML):
        cmd = [
            "firefox", "--headless",
            "--screenshot", CONTACT_SHEET_PNG,
            "--window-size", "1920,1080",
            f"file://{CONTACT_SHEET_HTML}"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"Rendered Contact Sheet: {CONTACT_SHEET_PNG} ({os.path.getsize(CONTACT_SHEET_PNG)} bytes)")

    print("\nPresentation pipeline successfully executed!")

if __name__ == "__main__":
    main()
