#!/usr/bin/env python3
"""Replace <i data-lucide="X"> with <svg>...<use/></svg> in index.html."""
import re
from pathlib import Path

HTML = Path('index.html')
content = HTML.read_text()

# Match: <i data-lucide="X" class="w-N h-N [other-classes]"></i>
# Capture lucide name and the full class string
pattern = re.compile(
    r'<i\s+data-lucide="([^"]+)"\s+class="([^"]+)"\s*></i>',
    re.DOTALL,
)

def replace(m):
    name = m.group(1)
    classes = m.group(2)
    return (
        f'<svg class="{classes}" aria-hidden="true" focusable="false">'
        f'<use href="./assets/icons/sprite.svg#i-{name}"></use>'
        f'</svg>'
    )

new_content, count = pattern.subn(replace, content)
HTML.write_text(new_content)
print(f'Replaced {count} <i data-lucide=...> with <svg><use/></svg>')