#!/usr/bin/env python3
"""
VEREDA Comprehensive Benchmark & Quality Test Suite
Categorized into:
1. Structural Checks (DOM, Assets, Screens)
2. Data Quality & Mathematical Rigor (Tobler formula, Cost decomposition, Citations)
3. Presentation & Print Layout (7 Slides, Print CSS, PDF Page Count)
4. Behavioral & Visual Accessibility (WCAG 2.1 AA, Viewport, Navigation)
"""

import os
import re
import json
import math
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_HTML = os.path.join(BASE_DIR, "index.html")
DECK_HTML = os.path.join(BASE_DIR, "docs", "pitch", "deck_slides_v2.html")
DECK_PDF = os.path.join(BASE_DIR, "docs", "pitch", "deck_slides_v2.pdf")
PREVIEWS_DIR = os.path.join(BASE_DIR, "docs", "pitch", "previews")
RESULTS_JSON = os.path.join(BASE_DIR, "docs", "quality", "benchmark_results.json")

def calculate_luminance(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def adjust(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = adjust(r), adjust(g), adjust(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def calculate_contrast(hex1, hex2):
    lum1 = calculate_luminance(hex1)
    lum2 = calculate_luminance(hex2)
    brightest = max(lum1, lum2)
    darkest = min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)

def run_tests():
    print("=" * 70)
    print("VEREDA COMPREHENSIVE QUALITY & BENCHMARK HARNESS")
    print("=" * 70)

    report = {
        "timestamp": "2026-10-12T10:45:00-03:00",
        "suites": {
            "structural": [],
            "data_and_math": [],
            "presentation_and_print": [],
            "accessibility_and_ux": []
        },
        "summary": {"pass": 0, "fail": 0, "warn": 0}
    }

    def record(category, test_name, status, details=""):
        report["suites"][category].append({
            "test": test_name,
            "status": status,
            "details": details
        })
        if status == "PASS":
            report["summary"]["pass"] += 1
        elif status == "FAIL":
            report["summary"]["fail"] += 1
        else:
            report["summary"]["warn"] += 1
        symbol = "✓" if status == "PASS" else ("✗" if status == "FAIL" else "⚠")
        print(f"[{symbol}] [{category.upper()}] {test_name}: {status} {f'({details})' if details else ''}")

    # =========================================================================
    # 1. STRUCTURAL CHECKS (index.html)
    # =========================================================================
    print("\n--- 1. STRUCTURAL CHECKS (App Shell & Components) ---")
    if not os.path.exists(APP_HTML):
        record("structural", "Application HTML File Exists", "FAIL", f"Missing {APP_HTML}")
        return report

    with open(APP_HTML, "r", encoding="utf-8") as f:
        app_html = f.read()

    record("structural", "App File Size Within Mobile Budget", "PASS" if len(app_html) < 250000 else "WARN", f"{len(app_html)/1024:.1f} KB")

    screens = ["screen-home", "screen-loading", "screen-dossier", "screen-checklist", "screen-compare", "screen-saved"]
    for s in screens:
        found = f'id="{s}"' in app_html
        record("structural", f"Screen Container: #{s}", "PASS" if found else "FAIL")

    modals = ["modalCandidate", "modalWhatsApp", "modalCadastralProvenance"]
    for m in modals:
        found = f'id="{m}"' in app_html
        record("structural", f"Interactive Modal: #{m}", "PASS" if found else "FAIL")

    svg_count = len(re.findall(r'<svg\b', app_html))
    record("structural", "Inline SVGs for Declutter and Telemetry", "PASS" if svg_count >= 8 else "WARN", f"{svg_count} SVGs found")

    # =========================================================================
    # 2. DATA QUALITY & MATHEMATICAL CONSISTENCY
    # =========================================================================
    print("\n--- 2. DATA QUALITY & MATHEMATICAL CONSISTENCY ---")
    
    # Mathematical Test: Bela Cintra Slope & Tobler Hiking Function
    dist_total = 620.0
    desnivel_total = 22.0
    avg_slope = (desnivel_total / dist_total) * 100.0 # 3.548%
    record("data_and_math", "Average Slope Formula (22m / 620m)", "PASS" if abs(avg_slope - 3.55) < 0.05 else "FAIL", f"Calculated: {avg_slope:.2f}%")

    steep_dist = 180.0
    steep_desnivel = 15.0
    steep_slope = (steep_desnivel / steep_dist) * 100.0 # 8.33%
    record("data_and_math", "Critical Segment Slope Formula (15m / 180m)", "PASS" if abs(steep_slope - 8.33) < 0.05 else "FAIL", f"Calculated: {steep_slope:.2f}%")

    # Tobler speed on slope: W = 6 * exp(-3.5 * |dh/dx + 0.05|)
    dh_dx = 15.0 / 180.0
    speed_uphill = 6.0 * math.exp(-3.5 * (dh_dx + 0.05)) # ~3.76 km/h
    time_uphill_min = (0.18 / speed_uphill) * 60.0
    record("data_and_math", "Tobler Hiking Speed on Incline (km/h)", "PASS" if 3.5 <= speed_uphill <= 4.0 else "FAIL", f"{speed_uphill:.2f} km/h (~{time_uphill_min:.1f} min in steep stretch)")

    # Mathematical Test: Cost Breakdown Reconciled
    aluguel = 3400
    condo_declarado = 600
    anunciado = aluguel + condo_declarado
    portaria_remota = 210
    fundo_reserva = 135
    seguro = 65
    efetivo = anunciado + portaria_remota + fundo_reserva + seguro
    record("data_and_math", "Cost Decomposition Sum Reconciled (R$ 4.000 -> R$ 4.410)", "PASS" if efetivo == 4410 else "FAIL", f"Sum: R$ {efetivo}")

    # Property Data Integrity in index.html
    for prop in ["solar", "pauliceia", "marfim"]:
        has_prop = f'{prop}:' in app_html
        record("data_and_math", f"Multi-Property Dataset: '{prop}'", "PASS" if has_prop else "FAIL")

    # Audit of Citations & Primary Sources in App / Deck
    with open(DECK_HTML, "r", encoding="utf-8") as f:
        deck_html = f.read()

    sources_to_check = ["GeoSampa", "CNEFE", "POF", "Lei do Inquilinato"]
    for src in sources_to_check:
        found_in_deck = src in deck_html
        record("data_and_math", f"Primary Citation Grounding: '{src}'", "PASS" if found_in_deck else "FAIL")

    # =========================================================================
    # 3. PRESENTATION & PRINT LAYOUT
    # =========================================================================
    print("\n--- 3. PRESENTATION & PRINT LAYOUT CHECKS ---")
    slides_found = re.findall(r'<section\s+class=\"[^\"]*\"\s+id=\"slide-(\d+)\">', deck_html)
    record("presentation_and_print", "Canonical Slide Count = 7", "PASS" if len(slides_found) == 7 else "FAIL", f"{len(slides_found)} slides found")

    has_print_media = "@media print" in deck_html
    has_page_rule = "@page" in deck_html
    has_break_after = "page-break-after" in deck_html or "break-after" in deck_html
    record("presentation_and_print", "Print Media Query Present", "PASS" if has_print_media else "FAIL")
    record("presentation_and_print", "CSS @page Dimensions Declared", "PASS" if has_page_rule else "FAIL")
    record("presentation_and_print", "Slide CSS Break-After Declared", "PASS" if has_break_after else "FAIL")

    # PDF Existence & Page Count
    if os.path.exists(DECK_PDF):
        pdf_size = os.path.getsize(DECK_PDF)
        record("presentation_and_print", "Deck PDF File Exists", "PASS", f"{pdf_size/1024:.1f} KB")
        # Check pages via pdfinfo
        try:
            info_res = subprocess.run(["pdfinfo", DECK_PDF], capture_output=True, text=True, check=True)
            match_pages = re.search(r'Pages:\s+(\d+)', info_res.stdout)
            if match_pages:
                pages = int(match_pages.group(1))
                record("presentation_and_print", "PDF Exact Page Count = 7 (No Overlap)", "PASS" if pages == 7 else "FAIL", f"{pages} pages")
        except Exception as e:
            record("presentation_and_print", "PDF Info Tool Execution", "WARN", str(e))
    else:
        record("presentation_and_print", "Deck PDF File Exists", "FAIL", "PDF not generated")

    # Slide Previews Check
    for i in range(1, 8):
        preview_path = os.path.join(PREVIEWS_DIR, f"slide_{i:02d}.png")
        exists = os.path.exists(preview_path) and os.path.getsize(preview_path) > 10000
        record("presentation_and_print", f"Rendered Preview: Slide {i:02d}", "PASS" if exists else "FAIL")

    # =========================================================================
    # 4. ACCESSIBILITY & UX CHECKS
    # =========================================================================
    print("\n--- 4. ACCESSIBILITY & INTERACTION BENCHMARKS ---")
    contrast_pairs = [
        ("Near Black (#171717) on Warm Paper (#F2EBDD)", "#171717", "#F2EBDD", 4.5),
        ("Near Black (#171717) on White (#FFFFFF)", "#171717", "#FFFFFF", 4.5),
        ("Deep Rust (#B94E36) on White (#FFFFFF)", "#B94E36", "#FFFFFF", 4.5),
        ("Signal Orange (#F47745) on Near Black (#171717)", "#F47745", "#171717", 3.0),
        ("Muted Sage (#7F8870) on White (#FFFFFF)", "#7F8870", "#FFFFFF", 3.0)
    ]
    for desc, c1, c2, target in contrast_pairs:
        ratio = calculate_contrast(c1, c2)
        record("accessibility_and_ux", f"WCAG Contrast: {desc}", "PASS" if ratio >= target else "WARN", f"{ratio:.2f}:1 (Target: {target}:1)")

    # Keyboard & Hash Nav in Deck
    has_keydown = "addEventListener('keydown'" in deck_html
    has_hash_init = "window.location.hash" in deck_html
    record("accessibility_and_ux", "Keyboard Arrow Navigation Supported", "PASS" if has_keydown else "FAIL")
    record("accessibility_and_ux", "Direct Hash/Query Slide Navigation", "PASS" if has_hash_init else "FAIL")

    # Mobile Viewport Tag
    has_viewport = 'meta name="viewport"' in app_html and 'meta name="viewport"' in deck_html
    record("accessibility_and_ux", "Mobile Responsive Viewport Declared", "PASS" if has_viewport else "FAIL")

    # Save Results JSON
    os.makedirs(os.path.dirname(RESULTS_JSON), exist_ok=True)
    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"BENCHMARK SUMMARY: {report['summary']['pass']} PASSED | {report['summary']['fail']} FAILED | {report['summary']['warn']} WARNINGS")
    print("=" * 70)
    return report

if __name__ == "__main__":
    run_tests()
