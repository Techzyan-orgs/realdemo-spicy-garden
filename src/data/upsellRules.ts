import { ExtendedMenuItem } from '@/hooks/useMenuData';
import { CartItem } from '@/context/CartContext';
import { RESTAURANT_DATA } from '@/data/restaurantData';

export interface UpsellRecommendation {
  recommendedItem: ExtendedMenuItem;
  anchorItemName: string;
  headline: string;
  pitch: string;
  sensoryDescription: string;
  socialProof: string;
  comboTag: string;
  tag: string;
}

/**
 * Resolves a high-quality dish image, prioritizing database uploaded images,
 * then falling back gracefully to category hero images.
 */
export function getDishImage(
  item?: { image?: string; image_url?: string; category?: string; category_id?: string } | null
): string {
  if (!item) return '/unnamed (2).webp';
  if (item.image_url && item.image_url.trim()) return item.image_url;
  if (item.image && item.image.trim()) return item.image;
  const cat = item.category || item.category_id;
  if (cat === 'pizza') return '/unnamed (2).webp';
  if (cat === 'pasta') return '/pasta.webp';
  if (cat === 'burger') return '/unnamed (3).webp';
  if (cat === 'maggi') return '/maggi.webp';
  if (cat === 'sandwich') return '/sandwich.webp';
  if (cat === 'chinese_specials') return '/unnamed (6).webp';
  return '/unnamed (2).webp';
}

// Map anchor dish categories/IDs to complementary recommendation candidate IDs in order of priority
interface PairingRule {
  anchorCategory?: string; // e.g. 'pizza', 'burger', 'pasta', 'chinese_specials', 'maggi'
  anchorItemIds?: string[]; // Specific dishes if granular
  tag: string;
  socialProofVeg: string;
  socialProofNonVeg: string;
  headlineVeg: string;
  headlineNonVeg: string;
  pitchVeg: string;
  pitchNonVeg: string;
  sensoryVeg: string;
  sensoryNonVeg: string;
  comboTagVeg: string;
  comboTagNonVeg: string;
  candidateIdsVeg: string[];
  candidateIdsNonVeg: string[];
}

export const PAIRING_RULES: PairingRule[] = [
  {
    anchorCategory: 'pizza',
    tag: "Chef's Star Pairing",
    socialProofNonVeg: '🔥 87% OF PIZZA LOVERS ADD THIS',
    socialProofVeg: '⭐ 84% OF GUESTS PAIR THIS',
    headlineNonVeg: 'Make It The Ultimate Pizza Feast!',
    headlineVeg: 'Upgrade To A Deluxe Gourmet Feast!',
    pitchNonVeg: 'Add Golden Crispy Fried Chicken Tenders',
    pitchVeg: 'Add Melted Cheese Corn Sandwich',
    sensoryNonVeg: 'Hand-breaded crunchy chicken tenders served with fiery salsa dip. Hot, juicy & fresh out of the fryer!',
    sensoryVeg: 'Golden-toasted bread oozing with sweet American corn & double molten cheese. The perfect crunch companion!',
    comboTagNonVeg: 'Cheesy Pizza + Crispy Tenders = Best Duo',
    comboTagVeg: 'Cheesy Pizza + Corn Melt = Comfort King',
    candidateIdsVeg: ['san-3', 'pas-3', 'mag-8'],
    candidateIdsNonVeg: ['chn-2', 'chn-1', 'san-9', 'san-3'],
  },
  {
    anchorCategory: 'burger',
    tag: 'Monster Combo Deal',
    socialProofNonVeg: '🔥 TOP RATED BURGER COMPANION',
    socialProofVeg: '⭐ 82% ORDER THIS SIDE',
    headlineNonVeg: 'Upgrade To The Big Bistro Feast!',
    headlineVeg: 'Make It A Complete Monster Meal!',
    pitchNonVeg: 'Add Golden Crispy Chicken Tenders',
    pitchVeg: 'Add Steaming Cheese Corn Maggi',
    sensoryNonVeg: 'Panko-crusted succulent chicken strips with spicy garlic mayo. The absolute king of burger sides!',
    sensoryVeg: 'Kolkata-style comforting noodles tossed with sweet corn and enveloped in silky melted cheese.',
    comboTagNonVeg: 'Stacked Burger + Crispy Crunch = Pure Joy',
    comboTagVeg: 'Loaded Burger + Hot Cheesy Maggi',
    candidateIdsVeg: ['san-3', 'mag-3', 'mag-2'],
    candidateIdsNonVeg: ['chn-2', 'chn-1', 'san-3'],
  },
  {
    anchorCategory: 'pasta',
    tag: 'Authentic Italian Match',
    socialProofNonVeg: "🔥 CHEF'S SIGNATURE PAIRING",
    socialProofVeg: '⭐ 89% PASTA LOVERS CHOOSE THIS',
    headlineNonVeg: 'Elevate Your Italian Experience!',
    headlineVeg: 'The Classic Italian Toast Companion!',
    pitchNonVeg: 'Add Golden Crispy Chicken Tenders',
    pitchVeg: 'Add Veg Cheese Sandwich Toast',
    sensoryNonVeg: 'Al dente penne bathed in velvety sauce, accompanied by golden seasoned chicken tenders hot off the pan.',
    sensoryVeg: 'Herb-buttered artisan bread grilled golden-brown, packed with fresh vegetables and molten cheddar.',
    comboTagNonVeg: 'Velvety Pasta + Crunchy Tenders',
    comboTagVeg: 'Saucy Pasta + Crispy Cheese Toast',
    candidateIdsVeg: ['san-2', 'san-7', 'san-3'],
    candidateIdsNonVeg: ['chn-2', 'san-9', 'san-2'],
  },
  {
    anchorCategory: 'chinese_specials',
    tag: 'Street Special Duo',
    socialProofNonVeg: '🔥 STREET-STYLE BESTSELLER',
    socialProofVeg: '⭐ POPULAR STREET COMPANION',
    headlineNonVeg: 'Complete Your Himalayan Feast!',
    headlineVeg: 'Make It A Street Food Celebration!',
    pitchNonVeg: 'Add Crispy Chicken Tenders & Soup Momos',
    pitchVeg: 'Add Golden Veg Cheese Burger',
    sensoryNonVeg: 'Handcrafted dumplings in clear herbal broth alongside crispy fried chicken strips with spicy dip.',
    sensoryVeg: 'Crisp vegetable cutlet with melted cheese and fresh garden relish inside toasted sesame buns.',
    comboTagNonVeg: 'Steamy Momos + Crunchy Tenders = Star Combo',
    comboTagVeg: 'Momos Soup + Cheesy Snack',
    candidateIdsVeg: ['san-3', 'mag-2', 'bur-2'],
    candidateIdsNonVeg: ['chn-2', 'chn-1', 'chn-3'],
  },
  {
    anchorCategory: 'maggi',
    tag: 'Comfort Food King',
    socialProofNonVeg: '🔥 CAMPUS FAVORITE DUO',
    socialProofVeg: '⭐ 85% REPEAT ORDER COMBO',
    headlineNonVeg: 'Level Up Your Comfort Bowl!',
    headlineVeg: 'The Ultimate Cozy Cafe Pairing!',
    pitchNonVeg: 'Add Golden Crispy Chicken Tenders',
    pitchVeg: 'Add Grilled Cheese Corn Sandwich',
    sensoryNonVeg: 'Add savory protein crunch to your spicy noodles with golden chicken strips and house salsa.',
    sensoryVeg: 'Sweet American corn paired with creamy molten cheese grilled in crisp herb-buttered sandwich slices.',
    comboTagNonVeg: 'Spicy Maggi + Crispy Tenders',
    comboTagVeg: 'Hot Maggi + Golden Corn Melt',
    candidateIdsVeg: ['san-3', 'bur-2', 'san-2'],
    candidateIdsNonVeg: ['chn-2', 'san-9', 'bur-6', 'san-3'],
  },
  {
    anchorCategory: 'sandwich',
    anchorItemIds: ['san-14', 'san-15', 'san-16', 'san-17', 'san-18', 'san-19'], // Club Sandwiches only
    tag: 'Banquet Feast',
    socialProofNonVeg: '🔥 BANQUET SPECIAL',
    socialProofVeg: '⭐ CAFE FAVORITE SPREAD',
    headlineNonVeg: 'Turn It Into A Grand Banquet!',
    headlineVeg: 'The Grand Cafe Spread!',
    pitchNonVeg: 'Add Golden Crispy Chicken Tenders',
    pitchVeg: 'Add Steaming Veg Cheese Maggi',
    sensoryNonVeg: 'Triple-decker club feast served with sizzling panko chicken strips and house salsa.',
    sensoryVeg: 'Piping hot Kolkata-style noodles smothered in cheese for the ultimate evening feast.',
    comboTagNonVeg: 'Triple Club + Crispy Tenders',
    comboTagVeg: 'Club Grill + Cheesy Maggi',
    candidateIdsVeg: ['mag-2', 'mag-3'],
    candidateIdsNonVeg: ['chn-2', 'chn-1', 'mag-7'],
  },
];

// Anti-spam cooldown keys
export const UPSELL_SESSION_DISMISSED_KEY = 'sg_upsell_dismissed_session';
export const UPSELL_LAST_TIMESTAMP_KEY = 'sg_upsell_last_time';
export const UPSELL_ACCEPTED_KEY = 'sg_upsell_accepted';
const COOLDOWN_SECONDS = 75; // 75 seconds between spotlight recommendations
const MAX_SESSION_PILL_SHOWS = 4;

/**
 * Check if the customer has already accepted an upsell suggestion in this session
 */
export function hasAcceptedAnyUpsell(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(UPSELL_ACCEPTED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Record that an upsell suggestion was accepted
 */
export function recordUpsellAccepted(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(UPSELL_ACCEPTED_KEY, 'true');
  } catch {}
}

/**
 * Reset upsell accepted state (e.g., when cart is completely cleared)
 */
export function resetUpsellAccepted(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(UPSELL_ACCEPTED_KEY);
  } catch {}
}

/**
 * Check if session is eligible for a floating suggestion
 */
export function isEligibleForUpsellPill(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. If customer has already accepted an upsell, DO NOT show more suggestions (no forcing)
    if (sessionStorage.getItem(UPSELL_ACCEPTED_KEY) === 'true') {
      return false;
    }

    // 2. Did the customer explicitly dismiss a suggestion pill this session?
    if (sessionStorage.getItem(UPSELL_SESSION_DISMISSED_KEY) === 'true') {
      return false;
    }

    // 3. Check total pills shown this session
    const count = parseInt(sessionStorage.getItem('sg_upsell_count') || '0', 10);
    if (count >= MAX_SESSION_PILL_SHOWS) {
      return false;
    }

    // 4. Check cooldown time
    const lastTime = parseInt(sessionStorage.getItem(UPSELL_LAST_TIMESTAMP_KEY) || '0', 10);
    const now = Date.now();
    if (now - lastTime < COOLDOWN_SECONDS * 1000) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Record that a suggestion pill was shown
 */
export function recordUpsellPillShown(): void {
  if (typeof window === 'undefined') return;
  try {
    const count = parseInt(sessionStorage.getItem('sg_upsell_count') || '0', 10);
    sessionStorage.setItem('sg_upsell_count', String(count + 1));
    sessionStorage.setItem(UPSELL_LAST_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

/**
 * Permanently mute floating pills for this session upon explicit user close
 */
export function muteUpsellPillForSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(UPSELL_SESSION_DISMISSED_KEY, 'true');
  } catch {}
}

/**
 * Core recommendation finder for an anchor item being added.
 * Ensures the database is the Single Source of Truth by querying active dishes
 * and checking live availability.
 */
export function findSmartUpsell({
  newlyAddedItem,
  cartItems,
  allMenuItems,
}: {
  newlyAddedItem: { id: string; name?: string; category?: string; isVeg?: boolean };
  cartItems: CartItem[];
  allMenuItems: ExtendedMenuItem[];
}): UpsellRecommendation | null {
  const menuPool = allMenuItems && allMenuItems.length > 0
    ? allMenuItems
    : (RESTAURANT_DATA.menu.items as unknown as ExtendedMenuItem[]);

  if (!newlyAddedItem || !menuPool || menuPool.length === 0) return null;

  // Determine dietary profile: If entire cart is vegetarian, STRICTLY recommend vegetarian items
  const hasNonVegInCart = cartItems.some((ci) => ci.variant === 'non-veg') || newlyAddedItem.isVeg === false;
  const isStrictlyVeg = !hasNonVegInCart;

  // Find matching pairing rule for the anchor item
  const rule = PAIRING_RULES.find((r) => {
    if (r.anchorItemIds && r.anchorItemIds.includes(newlyAddedItem.id)) return true;
    if (r.anchorCategory && r.anchorCategory === newlyAddedItem.category) return true;
    return false;
  });

  if (!rule) return null;

  const candidateIds = isStrictlyVeg ? rule.candidateIdsVeg : rule.candidateIdsNonVeg;
  const inCartItemIds = new Set(cartItems.map((ci) => ci.itemId));
  inCartItemIds.add(newlyAddedItem.id);

  const menuMap = new Map(menuPool.map((m) => [m.id, m]));

  // Pick the first available candidate that is NOT already in the cart and matches dietary rules
  for (const cid of candidateIds) {
    if (inCartItemIds.has(cid)) continue;

    const candidate = menuMap.get(cid);
    if (!candidate) continue;

    // Check database live availability (Single Source of Truth)
    if (candidate.isAvailable === false) continue;

    // Check dietary match
    if (isStrictlyVeg && !candidate.isVeg) continue;

    return {
      recommendedItem: candidate,
      anchorItemName: newlyAddedItem.name || 'Your Dish',
      headline: isStrictlyVeg ? rule.headlineVeg : rule.headlineNonVeg,
      pitch: isStrictlyVeg ? rule.pitchVeg : rule.pitchNonVeg,
      sensoryDescription: isStrictlyVeg ? rule.sensoryVeg : rule.sensoryNonVeg,
      socialProof: isStrictlyVeg ? rule.socialProofVeg : rule.socialProofNonVeg,
      comboTag: isStrictlyVeg ? rule.comboTagVeg : rule.comboTagNonVeg,
      tag: rule.tag,
    };
  }

  return null;
}

/**
 * Get complementary recommendations to display in the Order Modal ("Frequently Paired Together")
 * Returns up to 2 high-converting items based on cart contents, respecting live database availability.
 */
export function getCartComplements({
  cartItems,
  allMenuItems,
}: {
  cartItems: CartItem[];
  allMenuItems: ExtendedMenuItem[];
}): UpsellRecommendation[] {
  const menuPool = allMenuItems && allMenuItems.length > 0
    ? allMenuItems
    : (RESTAURANT_DATA.menu.items as unknown as ExtendedMenuItem[]);

  if (!cartItems.length || !menuPool.length) return [];

  // 1. If the user has already accepted a suggestion, DO NOT show more inside the cart (no forcing)
  if (hasAcceptedAnyUpsell()) {
    return [];
  }

  const inCartItemIds = new Set(cartItems.map((ci) => ci.itemId));

  // 2. If the cart already contains an anchor item and any of its natural complements,
  // the meal is already complete! Avoid showing more suggestions to keep the experience subtle.
  for (const cartItem of cartItems) {
    const rule = PAIRING_RULES.find((r) => {
      if (r.anchorItemIds && r.anchorItemIds.includes(cartItem.itemId)) return true;
      if (r.anchorCategory && r.anchorCategory === cartItem.category) return true;
      return false;
    });

    if (rule) {
      const allCandidates = [...rule.candidateIdsVeg, ...rule.candidateIdsNonVeg];
      const hasComplementInCart = allCandidates.some((cid) => inCartItemIds.has(cid));
      if (hasComplementInCart) {
        return []; // Combo already formed! Keep it clean and unforced.
      }
    }
  }

  const hasNonVeg = cartItems.some((ci) => ci.variant === 'non-veg');
  const isStrictlyVeg = !hasNonVeg;

  const menuMap = new Map(menuPool.map((m) => [m.id, m]));
  const recommendations: UpsellRecommendation[] = [];
  const chosenIds = new Set<string>();

  // Check each cart item against pairing rules
  for (const cartItem of cartItems) {
    const rule = PAIRING_RULES.find((r) => {
      if (r.anchorItemIds && r.anchorItemIds.includes(cartItem.itemId)) return true;
      if (r.anchorCategory && r.anchorCategory === cartItem.category) return true;
      return false;
    });

    if (!rule) continue;

    const candidateIds = isStrictlyVeg ? rule.candidateIdsVeg : rule.candidateIdsNonVeg;

    for (const cid of candidateIds) {
      if (inCartItemIds.has(cid) || chosenIds.has(cid)) continue;

      const candidate = menuMap.get(cid);
      if (!candidate || candidate.isAvailable === false) continue;
      if (isStrictlyVeg && !candidate.isVeg) continue;

      recommendations.push({
        recommendedItem: candidate,
        anchorItemName: cartItem.name,
        headline: isStrictlyVeg ? rule.headlineVeg : rule.headlineNonVeg,
        pitch: isStrictlyVeg ? rule.pitchVeg : rule.pitchNonVeg,
        sensoryDescription: isStrictlyVeg ? rule.sensoryVeg : rule.sensoryNonVeg,
        socialProof: isStrictlyVeg ? rule.socialProofVeg : rule.socialProofNonVeg,
        comboTag: isStrictlyVeg ? rule.comboTagVeg : rule.comboTagNonVeg,
        tag: rule.tag,
      });

      chosenIds.add(cid);
      if (recommendations.length >= 2) return recommendations;
      break; // Move to next cart item rule
    }
  }

  // Fallback if no specific rule match: suggest top bestsellers not in cart
  if (recommendations.length < 2) {
    const popularFallbacks = isStrictlyVeg
      ? ['san-3', 'pas-3', 'mag-2']
      : ['chn-2', 'chn-1', 'bur-6'];

    for (const fid of popularFallbacks) {
      if (inCartItemIds.has(fid) || chosenIds.has(fid)) continue;
      const candidate = menuMap.get(fid);
      if (!candidate || candidate.isAvailable === false) continue;
      if (isStrictlyVeg && !candidate.isVeg) continue;

      recommendations.push({
        recommendedItem: candidate,
        anchorItemName: cartItems[0]?.name || 'Your Order',
        headline: "Chef's Bestselling Companion!",
        pitch: isStrictlyVeg ? 'Customer Favorite Pair' : 'Bestselling Delicious Add-On',
        sensoryDescription: candidate.description || 'Freshly prepared specialty dish handcrafted to perfection.',
        socialProof: '🔥 MOST POPULAR PAIR TODAY',
        comboTag: 'Perfect Together',
        tag: 'Popular Pair',
      });
      chosenIds.add(fid);
      if (recommendations.length >= 2) break;
    }
  }

  return recommendations;
}
