#!/usr/bin/env python3
"""Draws the mod's sprites into assets/ as PNG files.

Each sprite is rows of letters; a letter names a color in the sprite's palette
and `.` is see-through. Run `python3 tools/sprites.py` after changing one.
Needs Pillow.
"""
import os
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
SCALE = 8  # each sprite pixel becomes an 8x8 block, so scaling stays crisp


def rgb(value):
    return ((value >> 16) & 255, (value >> 8) & 255, value & 255, 255)


def draw(art, palette):
    image = Image.new('RGBA', (max(len(row) for row in art), len(art)), (0, 0, 0, 0))
    for y, row in enumerate(art):
        for x, letter in enumerate(row):
            if letter != '.':
                image.putpixel((x, y), rgb(palette[letter]))
    return image


def save(name, image):
    image.resize((image.width * SCALE, image.height * SCALE), Image.NEAREST).save(os.path.join(OUT, name + '.png'))


# The HUD icons, nine pixels square as the game's are
HEART = [
    '.kk...kk.',
    'kaakkkabk',
    'kawaaabbk',
    'kaaaaabbk',
    'kaaaabbbk',
    '.kaabbbk.',
    '..kabbk..',
    '...kbk...',
    '....k....',
]
HALF = [
    '.kk...kk.',
    'kaakkkeek',
    'kawaeeeek',
    'kaaaeeeek',
    'kaaaeeeek',
    '.kaaeeek.',
    '..kaeek..',
    '...kek...',
    '....k....',
]
K = 0x160a0a
save('heart', draw(HEART, {'k': K, 'a': 0xff2a2a, 'b': 0xc41414, 'w': 0xffd0d0}))
save('heart-half', draw(HALF, {'k': K, 'a': 0xff2a2a, 'w': 0xffd0d0, 'e': 0x4a1c1c}))
save('heart-empty', draw(HEART, {'k': K, 'a': 0x4a1c1c, 'b': 0x3a1414, 'w': 0x5a2626}))
save('heart-hurt', draw(HEART, {'k': K, 'a': 0xffffff, 'b': 0xd8d8d8, 'w': 0xffffff}))

PLATE = [
    'kkk...kkk',
    'kabkkkbck',
    'kaabbbcck',
    'kkabbbckk',
    '.kabbbck.',
    '.kabbbck.',
    '.kabbbck.',
    '.kkbbbkk.',
    '..kkkkk..',
]
save('armor', draw(PLATE, {'k': 0x1c1c1c, 'a': 0xf4f4f4, 'b': 0xc0c0c0, 'c': 0x8a8a8a}))
save('armor-empty', draw(PLATE, {'k': 0x1c1c1c, 'a': 0x484848, 'b': 0x3c3c3c, 'c': 0x303030}))

DRUMSTICK = [
    '....kkkk.',
    '...kabbbk',
    '..kaabbck',
    '..kabbbck',
    '..kbbbcck',
    '.kkbbcck.',
    'kwwkkkk..',
    'kwwk.....',
    '.kk......',
]
save('food', draw(DRUMSTICK, {'k': 0x1e1208, 'a': 0xf0b060, 'b': 0xc8792d, 'c': 0x8f4f1a, 'w': 0xf4ecdc}))
save('food-empty', draw(DRUMSTICK, {'k': 0x1e1208, 'a': 0x4a3828, 'b': 0x3e2e20, 'c': 0x32241a, 'w': 0x4a4640}))

# The two heads, eight pixels square: the default skin's face, and Claude's
PLAYER = [
    'hhhhhhhh',
    'hhhhhhhh',
    'hsssssSh',
    'ssssssss',
    'swesseWs',
    'sssnnsss',
    'ssmnnmss',
    'ssmmmmss',
]
save('head-player', draw(PLAYER, {'h': 0x2f1f0f, 's': 0xbb8a66, 'S': 0xa87a58, 'w': 0xffffff, 'W': 0xffffff, 'e': 0x4a3fb5, 'n': 0x8f5f44, 'm': 0x5a3622}))
CLAUDE = [
    'llllllll',
    'lccccccd',
    'lcccccCd',
    'lckcckCd',
    'lckcckCd',
    'lcccccCd',
    'lckkkcCd',
    'dddddddd',
]
save('head-claude', draw(CLAUDE, {'l': 0xeaa083, 'c': 0xd97757, 'C': 0xc96a4c, 'd': 0xa9553b, 'k': 0x2b1a14}))

# The hotbar items, sixteen pixels square, each inside a slot's frame
ITEMS = {
    'pickaxe': ([
        '................',
        '...kkkkkkk......',
        '..kiddddddkk....',
        '..kdDDDDdddDk...',
        '...kkkkksdddk...',
        '.......ksSkddk..',
        '......ksSk.kdk..',
        '.....ksSk..kdDk.',
        '....ksSk...kdDk.',
        '...ksSk....kdDk.',
        '..ksSk......kk..',
        '.ksSk...........',
        'ksSk............',
        'kSk.............',
        '.k..............',
        '................',
    ], {'k': 0x101818, 'd': 0x4aedd9, 'D': 0x1f9c8f, 'i': 0xc8fff8, 's': 0xa87a48, 'S': 0x6b4423}),
    'book': ([
        '................',
        '....kkkkkkkkk...',
        '...kccccccccCk..',
        '..kccccccccCCk..',
        '..kcyyyyyycCCk..',
        '..kccccccccCCk..',
        '..kcyyyyccCCk...',
        '..kccccccccCCk..',
        '..kccccccccCCk..',
        '..kccccccccCCk..',
        '..kcccccccCCkwk.',
        '..kCCCCCCCCkwwk.',
        '..kkwwwwwwwwwWk.',
        '...kkWWWWWWWWk..',
        '....kkkkkkkkk...',
        '................',
    ], {'k': 0x1a1008, 'c': 0x9a5a2c, 'C': 0x6b3a18, 'y': 0xd8a848, 'w': 0xf4f0e4, 'W': 0xc8c0b0}),
    'bricks': ([
        'kkkkkkkkkkkkkkkk',
        'kbbbbbbmbbbbbbbk',
        'kbBBBBBmbBBBBBBk',
        'kBBBBBBmBBBBBBBk',
        'kmmmmmmmmmmmmmmk',
        'kbbmbbbbbbbmbbbk',
        'kBBmbBBBBBBmbBBk',
        'kBBmBBBBBBBmBBBk',
        'kmmmmmmmmmmmmmmk',
        'kbbbbbbmbbbbbbbk',
        'kbBBBBBmbBBBBBBk',
        'kBBBBBBmBBBBBBBk',
        'kmmmmmmmmmmmmmmk',
        'kbbmbbbbbbbmbbbk',
        'kBBmBBBBBBBmBBBk',
        'kkkkkkkkkkkkkkkk',
    ], {'k': 0x1c1210, 'b': 0xc0583c, 'B': 0x96402a, 'm': 0x8a7868}),
    'redstone': ([
        '................',
        '................',
        '.......kk.......',
        '......krRk......',
        '.....krRRrk.....',
        '....krRhRrk..k..',
        '...krRRRRrrkkrk.',
        '..krrRhRRRrrRrk.',
        '.krrRRRRhRRRrqk.',
        '.kqrRRhRRRRrrqk.',
        '.kqqrRRRRhRrqqk.',
        '..kqqrrRRRrqqk..',
        '...kkqqrrqqkk...',
        '.....kkkkkk.....',
        '................',
        '................',
    ], {'k': 0x1a0404, 'r': 0xc81e10, 'R': 0xff3a28, 'h': 0xff9080, 'q': 0x7a0c06}),
    'compass': ([
        '................',
        '.....kkkkkk.....',
        '...kkggggggkk...',
        '..kggiiiiiiGgk..',
        '..kgiwwwwRwiGk..',
        '.kgiwwwwRRwwiGk.',
        '.kgiwwwRRwwwiGk.',
        '.kgiwwkkwwwwiGk.',
        '.kgiwwkkwwwwiGk.',
        '.kgiwNNwwwwwiGk.',
        '.kgiNNwwwwwwiGk.',
        '..kgiNwwwwwiGk..',
        '..kgGiiiiiiGGk..',
        '...kkGGGGGGkk...',
        '.....kkkkkk.....',
        '................',
    ], {'k': 0x141414, 'g': 0xb0b0b0, 'G': 0x707070, 'i': 0x505050, 'w': 0x2a2a30, 'R': 0xff3a28, 'N': 0xe8e8e8}),
    'emerald': ([
        '................',
        '......kkkk......',
        '.....kEEeek.....',
        '....kEEeeeFk....',
        '...kEEeeeeeFk...',
        '..kEEeeeeeeeFk..',
        '..kEheeeeeeFFk..',
        '..kEheeeeeeFFk..',
        '..kEeeeeeeeFFk..',
        '..kEeeeeeeeFFk..',
        '..kEeeeeeeFFFk..',
        '...kEeeeeFFFk...',
        '....kEeeFFFk....',
        '.....kFFFFk.....',
        '......kkkk......',
        '................',
    ], {'k': 0x062a14, 'e': 0x17dd62, 'E': 0x7cf5a4, 'h': 0xd8ffe8, 'F': 0x0b8a3c}),
    'enchanted': ([
        '................',
        '....kkkkkkkkk...',
        '...kppppppppPk..',
        '..kppppppppPPk..',
        '..kppyyyyppPPk..',
        '..kpyyhhyypPPk..',
        '..kpyhhhhypPPk..',
        '..kpyyhhyypPPk..',
        '..kppyyyyppPPk..',
        '..kppppppppPPk..',
        '..kpppppppPPkwk.',
        '..kPPPPPPPPkwwk.',
        '..kkwwwwwwwwwWk.',
        '...kkWWWWWWWWk..',
        '....kkkkkkkkk...',
        '................',
    ], {'k': 0x180828, 'p': 0xa85cf0, 'P': 0x6a2aa8, 'y': 0xffd83d, 'h': 0xfff4b0, 'w': 0xf4f0e4, 'W': 0xc8c0b0}),
    'chest': ([
        '................',
        '.kkkkkkkkkkkkkk.',
        '.kssssssssssssk.',
        '.ksSSSSSSSSSSsk.',
        '.ksSssssssssSsk.',
        '.kkkkkkyykkkkkk.',
        '.kssssyhhyssssk.',
        '.ksSSSyhhySSSsk.',
        '.ksSsssyysssSsk.',
        '.ksSssssssssSsk.',
        '.ksSssssssssSsk.',
        '.ksSssssssssSsk.',
        '.ksSSSSSSSSSSsk.',
        '.kssssssssssssk.',
        '.kkkkkkkkkkkkkk.',
        '................',
    ], {'k': 0x1e1206, 's': 0xa8742c, 'S': 0x7a5018, 'y': 0xc8c8c8, 'h': 0xf0f0f0}),
    'paper': ([
        '................',
        '...kkkkkkkkk....',
        '..kwwwwwwwwwk...',
        '..kwwwwwwwwwWk..',
        '..kwgggggggwWk..',
        '..kwwwwwwwwwWk..',
        '..kwgggggwwwWk..',
        '..kwwwwwwwwwWk..',
        '..kwgggggggwWk..',
        '..kwwwwwwwwwWk..',
        '..kwggggwwwwWk..',
        '..kwwwwwwwwwWk..',
        '..kwwwwwwwwwWk..',
        '...kWWWWWWWWWk..',
        '....kkkkkkkkk...',
        '................',
    ], {'k': 0x202020, 'w': 0xf8f4e8, 'W': 0xc8c4b8, 'g': 0x8a8a8a}),
    'stone': ([
        'kkkkkkkkkkkkkkkk',
        'kggggGGgggggGggk',
        'kgllgGggglllGggk',
        'kglggGgggggggGGk',
        'kGGGGggGGGGgggGk',
        'kggggglggggGGggk',
        'kgllggGgglggGggk',
        'kgggGGGgggggGGGk',
        'kGGggggGGGggglgk',
        'kgggllggGggggggk',
        'kggggggGGgllgGGk',
        'kGGGgggGggggGggk',
        'kgglgGGggGGGgggk',
        'kgggggGgggglggGk',
        'kGGggggGGggggGGk',
        'kkkkkkkkkkkkkkkk',
    ], {'k': 0x1a1a1a, 'g': 0x8e8e8e, 'G': 0x6a6a6a, 'l': 0xb4b4b4}),
}
for name, (art, palette) in ITEMS.items():
    item = draw(art, palette)
    for held in (False, True):
        slot = Image.new('RGBA', (20, 20), rgb(0xffffff if held else 0x8b8b8b))
        slot.paste(Image.new('RGBA', (18, 18), rgb(0x373737)), (1, 1))
        slot.paste(Image.new('RGBA', (16, 16), rgb(0x2a2a2a if not held else 0x4a4a4a)), (2, 2))
        slot.paste(item, (2, 2), item)
        save('slot-' + name + ('-held' if held else ''), slot)

# A sheet of everything, for checking by eye; not shipped
if __name__ == '__main__' and os.environ.get('SHEET'):
    names = sorted(n for n in os.listdir(OUT) if n.endswith('.png'))
    images = [Image.open(os.path.join(OUT, n)) for n in names]
    sheet = Image.new('RGBA', (sum(i.width + 16 for i in images) + 16, 200), rgb(0x1e1e1e))
    x = 16
    for image in images:
        sheet.paste(image, (x, 16), image)
        x += image.width + 16
    sheet.save(os.environ['SHEET'])
