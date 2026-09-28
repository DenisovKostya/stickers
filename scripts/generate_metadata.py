#!/usr/bin/env python3
"""Scan original WebPs and merge reviewed tags. Requires Pillow at build time only."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
NAMES = {'kohannya': 'Kohannya', 'summer': 'Summer', 'autumn': 'Autumn'}
tags = json.loads((ROOT / 'data/tags.json').read_text())
packs, stickers = [], []
for folder in sorted((ROOT / 'stickers').iterdir()):
    if not folder.is_dir():
        continue
    files = sorted(folder.iterdir(), key=lambda p: (int(p.stem) if p.stem.isdigit() else float('inf'), p.name))
    packs.append({'id': folder.name, 'name': NAMES.get(folder.name, folder.name.replace('-', ' ').title()), 'count': len(files)})
    for file in files:
        with Image.open(file) as image:
            if image.format != 'WEBP' or getattr(image, 'n_frames', 1) != 1:
                raise ValueError(f'{file}: new media format needs compatibility review')
            info = tags.get(folder.name, {}).get(file.name)
            if not info or not info.get('emoji') or not info.get('keywords'):
                raise ValueError(f'Missing reviewed tags: {file}')
            stickers.append({'id': f'{folder.name}-{file.stem}', 'pack': folder.name,
                             'file': file.relative_to(ROOT).as_posix(), 'type': 'image',
                             'width': image.width, 'height': image.height, **info})
output = {'packs': packs, 'stickers': stickers}
(ROOT / 'data/stickers.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print(f'Generated {len(stickers)} stickers across {len(packs)} packs.')
