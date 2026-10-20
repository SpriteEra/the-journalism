#!/usr/bin/env python3
"""
Palette → design-token codemod for the admin panel (Tailwind v4).

  bg-white dark:bg-gray-800        ->  bg-surface            (dark: colour variants are dropped: tokens switch themselves)
  text-gray-500                     ->  text-fg-subtle
  bg-blue-600 hover:bg-blue-700     ->  bg-primary hover:bg-primary-hover
  bg-(--main2)/90                   ->  bg-primary/90
  bg-[#fcfcfc]                      ->  bg-surface
Usage:  codemod_tokens.py <src-dir> [--dry]
"""
import re, sys, os, collections

NEUTRAL = {'gray','slate','zinc','neutral','stone'}
FAMILY = {  # family -> token
  'blue':'primary','indigo':'primary','violet':'primary','purple':'primary',
  'sky':'info','cyan':'info','teal':'info',
  'red':'danger','rose':'accent','pink':'accent','fuchsia':'accent',
  'orange':'warning','amber':'warning','yellow':'warning',
  'green':'success','emerald':'success','lime':'success',
}
HOVERABLE = {'primary','danger','accent'}
UTIL = r'(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|from|via|to|fill|stroke|divide|outline|placeholder|accent|decoration|caret)'
FAMS = '|'.join(sorted(NEUTRAL|set(FAMILY), key=len, reverse=True))
VAL = rf'(?:(?:{FAMS})-\d{{2,3}}|white|black|\[#[0-9a-fA-F]{{3,8}}\]|\(--[a-z0-9-]+\))'
VARIANTS = r'(?:[a-z0-9-]+(?:\[[^\]\s]+\])?:)*'
TOKEN = re.compile(rf'(?<![\w\-:\[\]#./()@])({VARIANTS})({UTIL})-({VAL})(/\d{{1,3}})?(?![\w\-/\]])')

VARMAP = {'main1':'accent','main2':'primary','primary':'info','secondary':'fg','tertiary':'surface-3','bg':'surface'}
HEXMAP = {'fcfcfc':'surface','131523':'fg','a1a7c4':'fg-faint','ffffff':'surface','f9fafb':'surface-2','e5e7eb':'line','374151':'fg-muted'}

def neutral(util, shade):
    s = int(shade)
    base = util.split('-')[0]
    if base == 'text' or base in ('placeholder','caret','decoration'):
        if s >= 800: return 'fg'
        if s >= 600: return 'fg-muted'
        if s >= 500: return 'fg-subtle'
        if s >= 300: return 'fg-faint'
        return 'fg-muted'
    if base in ('fill','stroke'):
        return 'fg-subtle' if s >= 500 else 'fg-faint'
    if base == 'bg':
        if s <= 100: return 'surface-2'
        if s <= 300: return 'surface-3'
        if s <= 400: return 'line-strong'
        if s <= 600: return 'fg-faint'
        if s <= 700: return 'surface-3'
        return 'sidebar-2'
    if base in ('from','via','to'):
        return 'surface-2' if s <= 200 else 'surface-3' if s <= 400 else 'fg-faint'
    # border / ring / divide / outline / accent
    if base == 'accent': return 'primary'
    if s <= 200: return 'line'
    if s <= 500: return 'line-strong'
    return 'fg-faint'

def colour(util, fam, shade, variants):
    tok = FAMILY[fam]; s = int(shade); base = util.split('-')[0]
    hover = 'hover' in variants.split(':') or 'group-hover' in variants.split(':')
    if base == 'bg' or base in ('from','via','to'):
        if s <= 200: return f'{tok}-soft'
        if s >= 700 and hover and tok in HOVERABLE: return f'{tok}-hover'
        return tok
    if base == 'text':
        return tok
    if base in ('border','ring','divide','outline'):
        return f'{tok}/30' if s <= 200 else tok
    return tok

def convert(m, stats, unknown):
    variants, util, val, opacity = m.group(1), m.group(2), m.group(3), m.group(4) or ''
    vparts = variants.split(':')[:-1] if variants else []
    if 'dark' in vparts:
        stats['dark-removed'] += 1
        return None                                   # drop whole token
    base = util.split('-')[0]
    if val == 'white':
        tok = {'text':'paper','bg':'surface','fill':'paper','stroke':'paper'}.get(base, 'surface')
        if base in ('from','via','to'): tok = 'surface'
    elif val == 'black':
        tok = {'text':'fg','bg':'ink','border':'fg','ring':'fg','divide':'fg','outline':'fg','fill':'fg','stroke':'fg'}.get(base, 'ink')
        if base == 'border' and opacity: tok = 'line-strong'; opacity = ''
    elif val.startswith('(--'):
        name = val[3:-1]
        if name not in VARMAP: unknown[val] += 1; return m.group(0)
        tok = VARMAP[name]
    elif val.startswith('[#'):
        h = val[2:-1].lower()
        if len(h) == 3: h = ''.join(c*2 for c in h)
        if h not in HEXMAP: unknown[val] += 1; return m.group(0)
        tok = HEXMAP[h]
        if base in ('border','ring','divide') and tok in ('fg-faint',): tok = 'line-strong'
        if base == 'text' and tok == 'surface': tok = 'paper'
    else:
        fam, shade = val.rsplit('-', 1)
        tok = neutral(util, shade) if fam in NEUTRAL else colour(util, fam, shade, variants)
    if '/' in tok:                                      # token already carries an opacity (border-primary/30) -> keep the original if explicit
        tok, op2 = tok.split('/'); opacity = opacity or f'/{op2}'
    stats['mapped'] += 1
    return f'{variants}{util}-{tok}{opacity}'

def process(text, stats, unknown):
    out = []; pos = 0
    for m in TOKEN.finditer(text):
        new = convert(m, stats, unknown)
        out.append(text[pos:m.start()])
        if new is None:
            # swallow one adjacent whitespace so we do not leave double spaces
            if out[-1].endswith(' '): out[-1] = out[-1][:-1]
            elif text[m.end():m.end()+1] == ' ': pos = m.end() + 1; continue
        else:
            out.append(new)
        pos = m.end()
    out.append(text[pos:])
    return ''.join(out)

def main():
    root = sys.argv[1]; dry = '--dry' in sys.argv
    stats = collections.Counter(); unknown = collections.Counter(); changed = 0
    for d, _, files in os.walk(root):
        for f in files:
            if not f.endswith(('.jsx', '.js')): continue
            p = os.path.join(d, f)
            raw = open(p, 'rb').read(); s = raw.decode('utf-8')
            new = process(s, stats, unknown)
            # tidy: a className="  a  b " that became "a b"
            new = re.sub(r'className="\s+', 'className="', new); new = re.sub(r'\s+"(?=[ \n/>])', lambda mm: mm.group(0), new)
            if new != s:
                changed += 1
                if not dry: open(p, 'wb').write(new.encode('utf-8'))
    print(dict(stats), 'files changed:', changed)
    print('unmapped:', unknown.most_common(20))

if __name__ == '__main__': main()
