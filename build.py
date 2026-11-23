#!/usr/bin/env python3
"""Вставляет общие секции (hero/_sections.html) в hero/a.html, b.html, c.html между маркерами."""
import re, pathlib
root = pathlib.Path(__file__).parent / 'hero'
sec = (root / '_sections.html').read_text()
for n in 'abc':
    p = root / f'{n}.html'
    s = p.read_text()
    s2 = re.sub(r'<!--SECTIONS:BEGIN-->.*?<!--SECTIONS:END-->', lambda m: '<!--SECTIONS:BEGIN-->\n' + sec + '<!--SECTIONS:END-->', s, flags=re.S)
    assert s2 != s or sec in s, n
    p.write_text(s2)
    print(n, len(s2))
