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


# The advancement screen's icons: more items, sixteen pixels square. A sprite
# given as (base, palette) is the base's art in other colors.
def recolor(name, palette):
    art, base = ICONS[name]
    return (art, {**base, **palette})


ICONS = dict(ITEMS)
ICONS['pickaxe-wood'] = recolor('pickaxe', {'d': 0xa87a48, 'D': 0x6b4423, 'i': 0xc89a60})
ICONS['pickaxe-stone'] = recolor('pickaxe', {'d': 0x9a9a9a, 'D': 0x6a6a6a, 'i': 0xc8c8c8})
ICONS['pickaxe-iron'] = recolor('pickaxe', {'d': 0xe0e0e0, 'D': 0xa0a0a0, 'i': 0xffffff})
ICONS['pickaxe-netherite'] = recolor('pickaxe', {'d': 0x4a4046, 'D': 0x2c2428, 'i': 0x6e646a})
ICONS['obsidian'] = recolor('stone', {'g': 0x2a1a44, 'G': 0x180c2c, 'l': 0x4a3470, 'k': 0x0c0618})
ICONS['debris'] = recolor('stone', {'g': 0x6a4a3c, 'G': 0x4a3028, 'l': 0x8a6a58, 'k': 0x1c100c})
ICONS['purpur'] = recolor('bricks', {'b': 0xb078c0, 'B': 0x8a5a9a, 'm': 0x6a4078, 'k': 0x241030})
ICONS['clock'] = recolor('compass', {'g': 0xf0c040, 'G': 0xb08020, 'i': 0x806010, 'w': 0x2a2418})
ICONS['ingot'] = ([
    '................',
    '................',
    '................',
    '.....kkkkkkkkk..',
    '....kiiiiiiiigk.',
    '...kiaaaaaaaggk.',
    '..kiaaaaaaaaggk.',
    '.kiaaaaaaaaggGk.',
    '.kaaaaaaaaaggGk.',
    '.kggggggggggGGk.',
    '.kgGGGGGGGGGGk..',
    '.kGGGGGGGGGGk...',
    '..kkkkkkkkkk....',
    '................',
    '................',
    '................',
], {'k': 0x1a1a1a, 'i': 0xffffff, 'a': 0xd8d8d8, 'g': 0xa8a8a8, 'G': 0x787878})
ICONS['ingot-netherite'] = recolor('ingot', {'i': 0x7a7076, 'a': 0x4e444a, 'g': 0x3a3036, 'G': 0x282024, 'k': 0x0e0a0c})
ICONS['chestplate'] = ([
    '................',
    '.kkkk......kkkk.',
    '.kiaakk..kkaagk.',
    '.kiaaaakkaaaagk.',
    '.kiaaaaaaaaaagk.',
    '.kkiaaaaaaaagkk.',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kigggggggggk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
], {'k': 0x1a1a1a, 'i': 0xffffff, 'a': 0xd0d0d0, 'g': 0x909090})
ICONS['chestplate-diamond'] = recolor('chestplate', {'i': 0xc8fff8, 'a': 0x4aedd9, 'g': 0x1f9c8f, 'k': 0x0c2a28})
ICONS['shield'] = ([
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwssssssssgk..',
    '..kwssssssssgk..',
    '..kwssiissssgk..',
    '..kwssiissssgk..',
    '..kwssssssssgk..',
    '..kwssssssssgk..',
    '..kwssssssssgk..',
    '...kwssssssgk...',
    '...kwssssssgk...',
    '....kwssssgk....',
    '.....kwssgk.....',
    '......kkkk......',
    '................',
], {'k': 0x1a1208, 'w': 0xc8c8c8, 's': 0x9a6a3a, 'g': 0x6b4423, 'i': 0xd8d8d8})
ICONS['potion'] = ([
    '................',
    '......kkkk......',
    '.....kccccK.....',
    '......kwwk......',
    '......kwwk......',
    '.....kwwwwk.....',
    '....kwwwwwwk....',
    '...kwhwwwwwwk...',
    '..kwhppppppppk..',
    '..kwpppppppPpk..',
    '..kppppppppPpk..',
    '..kpppppppPPpk..',
    '...kppppPPPpk...',
    '....kppppppk....',
    '.....kkkkkk.....',
    '................',
], {'k': 0x14101c, 'K': 0x14101c, 'c': 0x9a6a3a, 'w': 0xd8e8f0, 'h': 0xffffff, 'p': 0xd040e0, 'P': 0x8a20a0})
ICONS['potion-blue'] = recolor('potion', {'p': 0x40a0ff, 'P': 0x2060c0})
ICONS['honey'] = recolor('potion', {'p': 0xf8b020, 'P': 0xc07808})
ICONS['diamond'] = ([
    '................',
    '................',
    '....kkkkkkkk....',
    '...kiiddddddk...',
    '..kiidddddddDk..',
    '.kiiddddddddDDk.',
    '.kidddddddddDDk.',
    '.kkdddddddddDkk.',
    '..kkdddddddDkk..',
    '...kkdddddDkk...',
    '....kkdddDkk....',
    '.....kkdDkk.....',
    '......kkkk......',
    '.......kk.......',
    '................',
    '................',
], {'k': 0x0c2a28, 'i': 0xd8fffa, 'd': 0x4aedd9, 'D': 0x1f9c8f})
ICONS['crystal'] = recolor('diamond', {'i': 0xffe0f4, 'd': 0xf080c8, 'D': 0xb04890, 'k': 0x30102a})
ICONS['bucket-lava'] = ([
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.kiiiiiiiiiiigk.',
    '.kiLLLlLLLLlLgk.',
    '.kiLlLLLLlLLLgk.',
    '.kkiiiiiiiiigkk.',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '..kiaaaaaaaagk..',
    '...kiaaaaaagk...',
    '...kiaaaaaagk...',
    '...kiaaaaaagk...',
    '....kggggggk....',
    '.....kkkkkk.....',
    '................',
], {'k': 0x1a1a1a, 'i': 0xf0f0f0, 'a': 0xc0c0c0, 'g': 0x808080, 'L': 0xff7a10, 'l': 0xffd040})
ICONS['bucket-water'] = recolor('bucket-lava', {'L': 0x3070f0, 'l': 0x80b8ff})
ICONS['bucket-ice'] = recolor('bucket-lava', {'L': 0xe8f4ff, 'l': 0xa8d0f0})
ICONS['eye'] = ([
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkaaaaaakk...',
    '..kaaaiiaaaabk..',
    '..kaaiaaaaabbk..',
    '.kaaaakkkkaabbk.',
    '.kaaakppppkabbk.',
    '.kaaakppppkabbk.',
    '.kaaaakkkkabbbk.',
    '..kaaaaaaabbbk..',
    '..kabbbbbbbbbk..',
    '...kkbbbbbbkk...',
    '.....kkkkkk.....',
    '................',
    '................',
], {'k': 0x0a1a10, 'a': 0x4ac878, 'i': 0xb8ffd0, 'b': 0x1c7a44, 'p': 0x102018})
ICONS['pearl'] = recolor('eye', {'a': 0x1f9c8f, 'i': 0x8af0e0, 'b': 0x0c5a54, 'p': 0x0c5a54, 'k': 0x04201e})
ICONS['apple-gold'] = ([
    '................',
    '.........kk.....',
    '........ksk.....',
    '.......kskgk....',
    '....kkkkskkgk...',
    '...kaaiakaaakk..',
    '..kaiiaaaaaaabk.',
    '..kaiaaaaaaaabk.',
    '..kaaaaaaaaaabk.',
    '..kaaaaaaaaabbk.',
    '..kaaaaaaaaabbk.',
    '...kaaaaaaabbk..',
    '...kabaaabbbbk..',
    '....kkbbbbbkk...',
    '......kkkkk.....',
    '................',
], {'k': 0x2a1c04, 's': 0x6b4423, 'g': 0x40a030, 'a': 0xf8d030, 'i': 0xfff8b0, 'b': 0xc08a10})
ICONS['apple'] = recolor('apple-gold', {'a': 0xe02818, 'i': 0xff9080, 'b': 0x981008, 'k': 0x280604})
ICONS['egg'] = ([
    '................',
    '......kkkk......',
    '.....kaaaak.....',
    '....kaapaaak....',
    '....kapaaaak....',
    '...kaaaaapaak...',
    '...kaaaaaaaak...',
    '..kaapaaaaaabk..',
    '..kaaaaaapaabk..',
    '..kaaaaaaaabbk..',
    '..kapaaaaaabbk..',
    '..kaaaaapabbbk..',
    '...kaaaabbbbk...',
    '....kbbbbbbk....',
    '.....kkkkkk.....',
    '................',
], {'k': 0x06040a, 'a': 0x2a1c3a, 'p': 0x8a40c0, 'b': 0x140c20})
ICONS['sword'] = ([
    '................',
    '............kkk.',
    '...........kiak.',
    '..........kiaak.',
    '.........kiaak..',
    '........kiaak...',
    '.......kiaak....',
    '..kk..kiaak.....',
    '..khkkiaak......',
    '...khhaak.......',
    '....khhk........',
    '...kshkhk.......',
    '..kssk.khk......',
    '.kssk...kk......',
    '.kkk............',
    '................',
], {'k': 0x141414, 'i': 0xffffff, 'a': 0xc8c8c8, 'h': 0x6b4423, 's': 0x9a6a3a})
ICONS['sword-diamond'] = recolor('sword', {'i': 0xc8fff8, 'a': 0x4aedd9})
ICONS['sword-gold'] = recolor('sword', {'i': 0xfff8b0, 'a': 0xf8d030})
ICONS['bow'] = ([
    '................',
    '....kkkk........',
    '....kwssk.......',
    '....kwkssk......',
    '....kwkkssk.....',
    '....kw.kkssk....',
    '....kw..kkssk...',
    '....kw...kssk...',
    '....kw...kssk...',
    '....kw..kkssk...',
    '....kw.kkssk....',
    '....kwkkssk.....',
    '....kwkssk......',
    '....kwssk.......',
    '....kkkk........',
    '................',
], {'k': 0x1a1208, 's': 0x9a6a3a, 'w': 0xe8e8e8})
ICONS['arrow'] = ([
    '................',
    '..........kkkkk.',
    '..........kiiak.',
    '.........kkiaak.',
    '........kskkak..',
    '.......kskkkk...',
    '......ksk.......',
    '.....ksk........',
    '....ksk.........',
    '..kkssk.........',
    '.kwwkk..........',
    '.kwwwk..........',
    '.kkwwk..........',
    '..kkkk..........',
    '................',
    '................',
], {'k': 0x141414, 'i': 0xffffff, 'a': 0xb0b0b0, 's': 0x9a6a3a, 'w': 0xf0f0f0})
ICONS['target'] = ([
    'kkkkkkkkkkkkkkkk',
    'kwwwwwwwwwwwwwwk',
    'kwrrrrrrrrrrrrwk',
    'kwrwwwwwwwwwwrwk',
    'kwrwrrrrrrrrwrwk',
    'kwrwrwwwwwwrwrwk',
    'kwrwrwrrrrwrwrwk',
    'kwrwrwryyrwrwrwk',
    'kwrwrwryyrwrwrwk',
    'kwrwrwrrrrwrwrwk',
    'kwrwrwwwwwwrwrwk',
    'kwrwrrrrrrrrwrwk',
    'kwrwwwwwwwwwwrwk',
    'kwrrrrrrrrrrrrwk',
    'kwwwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkkkk',
], {'k': 0x1a1a1a, 'w': 0xf0e8d8, 'r': 0xd83a2a, 'y': 0xf8d030})
ICONS['bed'] = ([
    '................',
    '................',
    '................',
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kwwwwkrrrrrrrk.',
    '.kwwwwkrrrrrrrk.',
    '.kWWWWkRRRRRRRk.',
    '.kkkkkkkkkkkkkk.',
    '.kssssssssssssk.',
    '.kSSSSSSSSSSSSk.',
    '.kkkkkkkkkkkkkk.',
    '.ksk........ksk.',
    '.kkk........kkk.',
    '................',
    '................',
], {'k': 0x1a1208, 'w': 0xf4f4f4, 'W': 0xc8c8c8, 'r': 0xd83a2a, 'R': 0x981c14, 's': 0x9a6a3a, 'S': 0x6b4423})
ICONS['table'] = ([
    'kkkkkkkkkkkkkkkk',
    'kttttttttttttttk',
    'ktTTTTTtTTTTTTtk',
    'ktTTTTTtTTTTTTtk',
    'kttttttttttttttk',
    'kkkkkkkkkkkkkkkk',
    'kssksssssssskssk',
    'ksgkswwsssSSksSk',
    'ksgkswwsssSSksSk',
    'ksskssssssssksSk',
    'kssksSSssggsksSk',
    'kssksSSssggsksSk',
    'kssksssssssskssk',
    'kSSkSSSSSSSSkSSk',
    'kSSkSSSSSSSSkSSk',
    'kkkkkkkkkkkkkkkk',
], {'k': 0x1a1208, 't': 0xc89a60, 'T': 0x9a6a3a, 's': 0xa87a48, 'S': 0x6b4423, 'g': 0x9a9a9a, 'w': 0xd8d8d8})
ICONS['wheat'] = ([
    '................',
    '....k.....k.....',
    '...kyk...kyk..k.',
    '...kyYk.kyYk.kyk',
    '..kyYk..kyYkkyYk',
    '..kyYk.kyYk.kyYk',
    '...kyYkkyYkkyYk.',
    '...kyYkkyYkkyYk.',
    '....kyYkYkkyYk..',
    '....ksYsYksYk...',
    '.....kssssssk...',
    '.....krrrrrrk...',
    '.....kssssssk...',
    '....kssksskssk..',
    '....kk.kk.kk....',
    '................',
], {'k': 0x241a04, 'y': 0xf0d060, 'Y': 0xc8a030, 's': 0xa88a3a, 'r': 0x981c14})
ICONS['bone'] = ([
    '................',
    '..........kk.kk.',
    '.........kwwkwwk',
    '.........kwwwwwk',
    '..........kwwwk.',
    '.........kwwgk..',
    '........kwwgk...',
    '.......kwwgk....',
    '......kwwgk.....',
    '.....kwwgk......',
    '....kwwgk.......',
    '..kkwwgk........',
    '.kwwwwk.........',
    '.kwwgwwk........',
    '..kkkwwk........',
    '.....kk.........',
], {'k': 0x1a1a1a, 'w': 0xf4f0e4, 'g': 0xc0b8a8})
ICONS['sapling'] = ([
    '................',
    '......kkkk......',
    '....kkgGgGkk....',
    '...kgGgggGggk...',
    '..kgggGgGgggGk..',
    '..kGgggggGgggk..',
    '.kggGgGgggGgggk.',
    '.kgggggGgggGgdk.',
    '..kgGgggGggddk..',
    '..kkdgGgdgddkk..',
    '....kkdsskkk....',
    '......kssk......',
    '......kssk......',
    '.....kssssk.....',
    '....kkkkkkkk....',
    '................',
], {'k': 0x0a1c08, 'g': 0x4ab030, 'G': 0x7ad850, 'd': 0x2a7018, 's': 0x6b4423})
ICONS['cake'] = ([
    '................',
    '................',
    '.....r...r...r..',
    '....kkkkkkkkkkk.',
    '...kwwwwwwwwwwwk',
    '..kwrwwwrwwwrwwk',
    '..kwwwwwwwwwwwwk',
    '..kwwwwwwwwwwwkk',
    '..kbwbbwbbwbbwbk',
    '..kbbbbbbbbbbbbk',
    '..kbbbbbbbbbbbbk',
    '..kBBBBBBBBBBBBk',
    '..kBBBBBBBBBBBBk',
    '..kkkkkkkkkkkkkk',
    '................',
    '................',
], {'k': 0x1c1008, 'w': 0xf8f4ec, 'r': 0xe02818, 'b': 0xb8742c, 'B': 0x8a5018})
ICONS['feather'] = ([
    '................',
    '...........kkkk.',
    '.........kkwwwk.',
    '.......kkwwwwgk.',
    '......kwwwwwgk..',
    '.....kwwwwwwgk..',
    '....kwwwwgwgk...',
    '....kwwwgwwgk...',
    '...kwwwgwwgk....',
    '...kwwgwwgkk....',
    '..kkwgwggk......',
    '..kwkggkk.......',
    '.kwk.kk.........',
    '.kk.............',
    '................',
    '................',
], {'k': 0x1a1a1a, 'w': 0xf4f4f4, 'g': 0xb8b8b8})
ICONS['totem'] = ([
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '....kygyygyk....',
    '....kyyyyyyk....',
    '..kkkyykkyykkk..',
    '.kyykyyyyyykyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kkkkyyggyykkkk.',
    '....kyyggyyk....',
    '....kyyyyyyk....',
    '....kYyyyyYk....',
    '.....kYyyYk.....',
    '.....kYYYYk.....',
    '......kkkk......',
    '................',
], {'k': 0x2a1c04, 'y': 0xf8d030, 'Y': 0xc08a10, 'g': 0x40a030})

# Which item each advancement shows
ADVANCEMENT_ICONS = {
    'stoneAge': 'pickaxe-wood', 'upgrade': 'pickaxe-stone', 'acquireHardware': 'ingot', 'suitUp': 'chestplate',
    'notToday': 'shield', 'furiousCocktail': 'potion', 'howDidWe': 'potion-blue', 'ironPick': 'pickaxe-iron',
    'diamonds': 'diamond', 'coverMe': 'chestplate-diamond', 'coverMeInDebris': 'ingot-netherite',
    'enchanter': 'enchanted', 'hotStuff': 'bucket-lava', 'iceBucket': 'bucket-ice', 'eyeSpy': 'eye',
    'zombieDoctor': 'apple-gold',
    'deeper': 'obsidian', 'subspaceBubble': 'paper', 'feelsLikeHome': 'emerald', 'thoseWereTheDays': 'book',
    'hiddenInTheDepths': 'debris', 'returnToSender': 'redstone', 'totalBeelocation': 'honey',
    'theEnd': 'eye', 'freeTheEnd': 'egg', 'nextGeneration': 'egg', 'theEndAgain': 'crystal',
    'greatView': 'feather', 'remoteGetaway': 'pearl', 'cityAtTheEnd': 'purpur',
    'monsterHunter': 'sword', 'takeAim': 'bow', 'sniperDuel': 'arrow', 'bullseye': 'target',
    'monstersHunted': 'sword-diamond', 'overOverkill': 'sword-gold', 'heroOfTheVillage': 'emerald',
    'arbalistic': 'bow', 'postmortal': 'totem', 'cavesAndCliffs': 'bucket-water', 'stickySituation': 'honey',
    'sneak100': 'feather', 'isItABird': 'compass', 'underLockAndKey': 'chest', 'revaulting': 'chest',
    'sweetDreams': 'bed', 'adventuringTime': 'compass', 'countryLode': 'stone', 'craftersCrafting': 'table',
    'aSeedyPlace': 'wheat', 'reapWhatYouSow': 'wheat', 'seriousDedication': 'pickaxe-netherite',
    'aBalancedDiet': 'apple', 'glowAndBehold': 'paper', 'bestFriendsForever': 'bone', 'homesteader': 'bed',
    'oldGrowth': 'sapling', 'passingTheTime': 'clock', 'birthdaySong': 'cake', 'plantingThePast': 'bricks',
}

# The three frames, twenty pixels square, as letter masks: `o` the rim, `i`
# its lit edge, `f` the fill. A task is a square, a goal is rounded, and a
# challenge has pointed corners.
def frame(kind):
    rows = []
    for y in range(20):
        row = ''
        for x in range(20):
            dx, dy = min(x, 19 - x), min(y, 19 - y)
            edge = min(dx, dy)
            if kind == 'goal':
                inside = dx + dy >= 4
                rim = dx + dy < 6 or edge < 2
            elif kind == 'challenge':
                notch = (dx >= 5 and dy == 0) or (dy >= 5 and dx == 0)
                inside = not notch
                rim = edge < 2 or (dx < 4 and dy < 4)
            else:
                inside = dx + dy >= 1
                rim = edge < 2
            if not inside:
                row += '.'
            elif rim:
                row += 'i' if (x < 10 and y < 10 and edge == 0) or edge == 0 and (x == dx or y == dy) else 'o'
            else:
                row += 'f'
        rows.append(row)
    return rows


FRAME_TINTS = {
    'earned': {'o': 0xd8a020, 'i': 0xffe878, 'f': 0x8a6410},
    'open': {'o': 0x8b8b8b, 'i': 0xc6c6c6, 'f': 0x3c3c3c},
    'locked': {'o': 0x3a3a3a, 'i': 0x4a4a4a, 'f': 0x1e1e1e},
}

import re
LORE = open(os.path.join(os.path.dirname(__file__), '..', 'hooks', 'lore.ts')).read()
FRAMES = re.findall(r'id: "(\w+)",[^\n]*?tab: "([^"]+)", frame: "(\w+)"', LORE)
# The ground of each tab's tree, as TAB_GROUND in hooks/lore.ts has it: an
# icon's corners are filled with it, so no gap shows around the frame
GROUND = {'Minecraft': 0x2e2e32, 'Nether': 0x341416, 'The End': 0x32301e, 'Adventure': 0x1e3020, 'Husbandry': 0x33261a}
for advancement, tab, kind in FRAMES:
    art, palette = ICONS[ADVANCEMENT_ICONS[advancement]]
    for row in art:
        assert len(row) == 16, (ADVANCEMENT_ICONS[advancement], row)
    for state, tint in FRAME_TINTS.items():
        tile = Image.new('RGBA', (20, 20), rgb(GROUND[tab]))
        rim = draw(frame(kind), tint)
        tile.paste(rim, (0, 0), rim)
        # An advancement still locked shows its item as a shadow
        item = draw(art, {key: 0x343434 for key in palette} if state == 'locked' else palette)
        tile.paste(item, (2, 2), item)
        save('adv-' + advancement + '-' + state, tile)

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
