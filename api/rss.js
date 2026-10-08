import { findBurgers, formatMessage } from './burger.js';

const SOURCE_URL = 'https://beethoven.breaktimebistro.cz';

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Same data as /api/burger, as an RSS feed for Power Automate's standard RSS connector.
// One <item> per burger day, empty channel when there is no burger.
export default async function handler(req, res) {
  try {
    const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 bistro-burger' } });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);

    const now = new Date().toUTCString();
    const items = findBurgers(await response.text())
      .map(
        (burger) => `    <item>
      <title>${escapeXml(formatMessage([burger]))}</title>
      <description>${escapeXml(burger.dish)}</description>
      <link>${SOURCE_URL}</link>
      <guid isPermaLink="false">${burger.date}-${escapeXml(burger.dish)}</guid>
      <pubDate>${now}</pubDate>
    </item>`
      )
      .join('\n');

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Break Time Bistro Beethoven - burger</title>
    <link>${SOURCE_URL}</link>
    <description>Burger v poledním menu tento týden</description>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`);
  } catch (err) {
    res.status(502).send(String(err.message || err));
  }
}
