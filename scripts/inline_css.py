#!/usr/bin/env python3
"""Inline minified CSS into index.html for max Lighthouse performance.
Replaces the external <link> tags with a single inlined <style> block."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TW = (ROOT / 'assets/css/tw.css').read_text()
STYLE = (ROOT / 'assets/css/style.css').read_text()

# Strip comments + collapse whitespace for style.css
def minify(css: str) -> str:
    css = re.sub(r'/\*[\s\S]*?\*/', '', css)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css)
    css = re.sub(r';\}', '}', css)
    return css.strip()

inline_css = TW + minify(STYLE)
print(f'CSS inlined: {len(TW)} + {len(STYLE)} → {len(inline_css)} bytes (minified: {len(minify(STYLE))} bytes saved on style.css)')

html_path = ROOT / 'index.html'
html = html_path.read_text()

# Remove external CSS <link> tags
html = re.sub(
    r'\s*<link rel="stylesheet" href="\./assets/css/(tw|style)\.css">\s*',
    '\n    ',
    html,
)

# Remove any previously inlined <style> blocks first (idempotent rebuild)
html = re.sub(r'\s*<style>.*?</style>', '', html, flags=re.DOTALL)

# Also remove external CSS <link> tags (idempotent rebuild)
html = re.sub(
    r'\s*<link rel="stylesheet" href="\./assets/css/(tw|style)\.css">\s*',
    '\n    ',
    html,
)

# Insert <style> in head (after existing head content, before </head>)
style_tag = f'    <style>{inline_css}</style>\n  '
html = re.sub(r'\s*</head>', '\n  ' + style_tag + '</head>', html, count=1)

html_path.write_text(html)
print('Done. CSS inlined into <head>.')