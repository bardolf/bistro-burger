const SOURCE_URL = 'https://beethoven.breaktimebistro.cz';

// "ve čtvrtek", "v pondělí" ... indexed by Date.getUTCDay()
const DAY_PHRASES = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const toText = (html) =>
  decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

// Drops allergen list like "|1,3,7|" from a dish description.
const cleanDish = (s) => s.replace(/\|[\d,\s]*\|/g, '').replace(/\s+/g, ' ').trim();

export function findBurgers(html) {
  const burgers = [];
  // Each day: <div class="op-menu-day ..." data-date="2026-10-08"> ... until the next day block
  const dayBlocks = html.split(/<div class="op-menu-day[^"]*"/).slice(1);

  for (const block of dayBlocks) {
    const date = block.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (!date) continue;

    const items = block.split(/<div class="food-list-item">/).slice(1);
    for (const item of items) {
      // Description is the text after the <strong> label, without the price.
      const body = item
        .split(/<\/div>/)[0]
        .replace(/<strong>.*?<\/strong>/s, '')
        .replace(/<span class="price">.*?<\/span>/s, '');
      const dish = cleanDish(toText(body));
      if (/burger/i.test(dish)) burgers.push({ date, dish });
    }
  }
  return burgers;
}

export function formatMessage(burgers) {
  return burgers
    .map(({ date, dish }) => {
      const d = new Date(`${date}T12:00:00Z`);
      return `Důležité upozornění, ${DAY_PHRASES[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}. je burger (${dish})`;
    })
    .join('\n');
}

export default async function handler(req, res) {
  try {
    const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 bistro-burger' } });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);

    const burgers = findBurgers(await response.text());
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      hasBurger: burgers.length > 0,
      message: burgers.length > 0 ? formatMessage(burgers) : '',
      burgers,
    });
  } catch (err) {
    res.status(502).json({ hasBurger: false, message: '', error: String(err.message || err) });
  }
}
