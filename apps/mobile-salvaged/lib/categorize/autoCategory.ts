/**
 * Lightweight, deterministic category detection for the lend flow's WHAT
 * step. Keyword table only — no ML. The goal is "good enough to surface
 * the right chip so the user usually doesn't have to override".
 *
 * Categories are intentionally limited to six high-level buckets that
 * cover most household lend-able items.
 */

export type LendCategory =
  | 'book'
  | 'tool'
  | 'electronics'
  | 'clothing'
  | 'kitchen'
  | 'other';

export const LEND_CATEGORIES: ReadonlyArray<LendCategory> = [
  'book',
  'tool',
  'electronics',
  'clothing',
  'kitchen',
  'other',
];

export const categoryLabels: Record<LendCategory, string> = {
  book: 'Book',
  tool: 'Tool',
  electronics: 'Electronics',
  clothing: 'Clothing',
  kitchen: 'Kitchen',
  other: 'Other',
};

export const categoryEmojis: Record<LendCategory, string> = {
  book: '📚',
  tool: '🔧',
  electronics: '📱',
  clothing: '👕',
  kitchen: '🍳',
  other: '📦',
};

// Order here is also the resolution order for ambiguous keywords.
const KEYWORDS: Record<Exclude<LendCategory, 'other'>, ReadonlyArray<string>> = {
  book: [
    'book',
    'books',
    'novel',
    'textbook',
    'magazine',
    'comic',
    'manga',
    'paperback',
    'hardcover',
    'encyclopedia',
    'dictionary',
    'cookbook',
    'atlas',
    'bible',
    'biography',
    'memoir',
    'journal',
    'diary',
    'harry potter',
    'potter',
    'tolkien',
    'lord of the rings',
    'lotr',
    'shakespeare',
  ],
  tool: [
    'drill',
    'hammer',
    'wrench',
    'saw',
    'ladder',
    'screwdriver',
    'pliers',
    'level',
    'tape measure',
    'sander',
    'jigsaw',
    'circular saw',
    'miter saw',
    'chainsaw',
    'axe',
    'shovel',
    'rake',
    'mower',
    'lawnmower',
    'trimmer',
    'leaf blower',
    'pressure washer',
    'toolbox',
    'toolkit',
    'vise',
    'clamp',
    'allen key',
    'hex key',
    'socket',
    'ratchet',
    'crowbar',
    'chisel',
    'router',
    'multimeter',
  ],
  electronics: [
    'tv',
    'television',
    'monitor',
    'laptop',
    'computer',
    'pc',
    'tablet',
    'ipad',
    'phone',
    'iphone',
    'android phone',
    'charger',
    'cable',
    'headphones',
    'earbuds',
    'airpods',
    'speaker',
    'soundbar',
    'projector',
    'camera',
    'gopro',
    'dslr',
    'drone',
    'console',
    'xbox',
    'playstation',
    'ps5',
    'ps4',
    'nintendo',
    'switch',
    'kindle',
    'modem',
    'hard drive',
    'ssd',
    'keyboard',
    'mouse',
    'webcam',
    'microphone',
  ],
  clothing: [
    'shirt',
    'tshirt',
    't-shirt',
    'pants',
    'jacket',
    'coat',
    'sweater',
    'hoodie',
    'dress',
    'suit',
    'tie',
    'hat',
    'cap',
    'scarf',
    'gloves',
    'socks',
    'shoes',
    'boots',
    'sneakers',
    'sandals',
    'jeans',
    'shorts',
    'skirt',
    'blouse',
    'vest',
    'blazer',
    'parka',
    'raincoat',
    'swimsuit',
    'costume',
    'uniform',
    'jersey',
  ],
  kitchen: [
    'pan',
    'pot',
    'skillet',
    'wok',
    'blender',
    'mixer',
    'kettle',
    'toaster',
    'oven',
    'microwave',
    'stove',
    'grill',
    'smoker',
    'knife',
    'knives',
    'plate',
    'bowl',
    'mug',
    'pitcher',
    'teapot',
    'pressure cooker',
    'slow cooker',
    'crockpot',
    'instant pot',
    'air fryer',
    'food processor',
    'juicer',
    'coffee maker',
    'coffeemaker',
    'espresso',
    'kitchenaid',
    'whisk',
    'spatula',
    'tongs',
    'cutting board',
    'colander',
    'casserole',
    'baking sheet',
  ],
};

const CATEGORY_ORDER: ReadonlyArray<Exclude<LendCategory, 'other'>> = [
  'book',
  'tool',
  'electronics',
  'clothing',
  'kitchen',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the best-guess lend category for the given title. Matches are
 * case-insensitive and require a word-boundary so that "saw" doesn't match
 * "samsung" or "kettle" inside "kettlebell". Falls back to `'other'` when
 * no keyword matches.
 */
export function detectCategory(title: string): LendCategory {
  if (!title || typeof title !== 'string') return 'other';

  const normalized = title.trim().toLowerCase();
  if (!normalized) return 'other';

  for (const category of CATEGORY_ORDER) {
    for (const keyword of KEYWORDS[category]) {
      const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      if (pattern.test(normalized)) return category;
    }
  }

  return 'other';
}
