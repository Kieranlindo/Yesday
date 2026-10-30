export const FEATURES: Record<string, string> = {
  catering: 'In-house catering', halal: 'Halal menus', veg: 'Vegetarian menus', outside: 'Outside caterers welcome',
  outdoor: 'Outdoor ceremony', late: 'Late licence to 1am', suite: 'Bridal suite', rooms: 'Rooms on site', parking: 'Parking on site',
};
export const CHAPTERS: Record<string, string> = {
  venue: 'The venue', ceremony: 'Ceremony and reception', breakfast: 'Wedding breakfast', drinks: 'Drinks',
  evening: 'The evening', styling: 'Styling', stay: 'Staying over',
};
export const RULES: Record<string, string> = {
  finish: 'Last music', drinks: 'Drinks', suppliers: 'Your own suppliers', confetti: 'Confetti', candles: 'Candles', fire: 'Fireworks and sparklers', limiter: 'Sound limiter',
};
export const UNIT: Record<string, string> = { flat: '', pp: ' a guest', eve: ' an evening guest', table: ' a table', room: ' a room' };

/** Names as people would write them, even if they were typed in lower case. */
export const nameCase = (s: string) => s.trim().replace(/(^|[\s'-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
export const coupleName = (u: { firstName: string; partnerName: string | null }) => (u.partnerName ? `${nameCase(u.firstName)} & ${nameCase(u.partnerName)}` : nameCase(u.firstName));

/** Styles and needs couples can filter by. */
export const STYLES = ['Palace', 'Historic', 'Museum', 'Garden', 'City', 'Country house', 'Hotel'];
export const NEEDS: [string, string][] = [['halal', 'Halal menus'], ['veg', 'Vegetarian menus'], ['outside', 'Your own caterers'], ['outdoor', 'Outdoor ceremony'], ['late', 'Late licence'], ['rooms', 'Rooms on site'], ['parking', 'Parking']];
