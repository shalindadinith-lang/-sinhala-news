// generate-rss.js
const https = require('https');
const fs = require('fs');

// ඔබ site එකට ගන්න RSS feeds (Lanka C News, Ada Derana)
const FEEDS = [
  'https://api.rss2json.com/v1/api.json?rss_url=https://www.lankacnews.com/feeds/posts/default?alt=rss',
  'https://api.rss2json.com/v1/api.json?rss_url=https://www.adaderana.lk/rss.php'
];

// ඔබේ GitHub Pages URL එක (අවසානයේ / තියෙනවද කියලා බලන්න)
const SITE_BASE = 'https://shalindadinith-lang.github.io/-sinhala-news/';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  let items = [];
  for (let feed of FEEDS) {
    try {
      const json = await fetchJSON(feed);
      if (json.items) items = items.concat(json.items);
    } catch(e) { console.error('Feed fail:', feed); }
  }

  // duplicate links අයින් කරන්න
  const unique = new Map();
  items.forEach(i => { if (!unique.has(i.link)) unique.set(i.link, i); });
  const articles = Array.from(unique.values());

  // date අනුව sort
  articles.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));

  // RSS items හදන්න
  let rssItems = '';
  articles.slice(0, 30).forEach(article => {
    const title = article.title.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const desc = (article.description || '').replace(/<[^>]*>/g,'').substring(0,300).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const pubDate = new Date(article.pubDate).toUTCString();
    // quan trọng: මෙතන link එක ඔබේ site එකේ article hash එකට point කරනවා
    const link = SITE_BASE + '#article=' + encodeURIComponent(article.link);
    const img = (article.thumbnail || '').replace('s72','s600');

    rssItems += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${img}" type="image/jpeg" />
    </item>`;
  });

  // RSS file එක
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI News Lanka</title>
    <link>${SITE_BASE}</link>
    <description>AI බලයෙන් සිංහල පුවත්</description>
    <language>si</language>
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync('rss.xml', rss);
  console.log('rss.xml file එක හැදුනා!');
}

main();