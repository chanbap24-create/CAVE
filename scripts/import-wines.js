const { Client } = require('pg');
const sqlite3 = require('better-sqlite3');
const path = require('path');

const SQLITE_PATH = '/Users/hajin/order_ai/data.sqlite3';
const PG_URL = process.env.DATABASE_URL;

// Country name mapping (Korean to English)
const countryMap = {
  '프랑스': 'France', '이탈리아': 'Italy', '미국': 'USA',
  '스페인': 'Spain', '독일': 'Germany', '포르투갈': 'Portugal',
  '칠레': 'Chile', '아르헨티나': 'Argentina', '호주': 'Australia',
  '뉴질랜드': 'New Zealand', '영국': 'UK', '오스트리아': 'Austria',
  '남아공': 'South Africa', '일본': 'Japan', '헝가리': 'Hungary',
};

// Wine type mapping
const typeMap = {
  'Red': 'red', 'White': 'white', 'Rose': 'rose', 'Rosé': 'rose',
  'Sparkling': 'sparkling', 'Sweet': 'dessert', 'Fortified': 'fortified',
  'Orange': 'orange',
};

function parseGrapes(raw) {
  if (!raw) return null;
  // Clean up grape varieties string into array
  return raw.split(/[,\/]/)
    .map(g => g.trim())
    .filter(g => g && g.length > 1 && !g.match(/^\d/))
    .slice(0, 5);
}

function parseVintage(raw) {
  if (!raw) return null;
  const match = raw.match(/(\d{2,4})/);
  if (!match) return null;
  let year = parseInt(match[1]);
  if (year < 100) year += 2000;
  if (year < 1900 || year > 2030) return null;
  return year;
}

function parseAlcohol(raw) {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

(async () => {
  const db = sqlite3(SQLITE_PATH, { readonly: true });
  const pg = new Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  // Get wines with profiles
  const rows = db.prepare(`
    SELECT
      i.item_no, i.item_name, i.vintage, i.alcohol_content, i.country,
      p.region, p.sub_region, p.grape_varieties, p.wine_type,
      p.description_kr, p.tasting_aroma, p.tasting_palate, p.food_pairing
    FROM inventory_cdv i
    LEFT JOIN wine_profiles p ON i.item_no = p.item_code
    WHERE i.country IS NOT NULL AND i.country != ''
      AND i.item_name NOT LIKE '%케이스%'
      AND i.item_name NOT LIKE '%박스%'
      AND i.item_name NOT LIKE '%에어팩%'
      AND i.item_name NOT LIKE '%지함%'
      AND i.item_name NOT LIKE '%세트%'
  `).all();

  console.log(`Found ${rows.length} wines to import`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const country = countryMap[row.country] || row.country;
    const wineType = typeMap[row.wine_type] || null;
    const grapes = parseGrapes(row.grape_varieties);
    const vintage = parseVintage(row.vintage);
    const alcohol = parseAlcohol(row.alcohol_content);

    // Build metadata
    const metadata = {};
    if (row.tasting_aroma) metadata.aroma = row.tasting_aroma;
    if (row.tasting_palate) metadata.palate = row.tasting_palate;
    if (row.food_pairing) metadata.food_pairing = row.food_pairing;

    try {
      await pg.query(`
        INSERT INTO wines (category, name, name_ko, wine_type, region, country, grape_variety, vintage_year, alcohol_pct, metadata, verified, external_ref)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
        ON CONFLICT DO NOTHING
      `, [
        'wine',
        row.item_name,
        row.item_name,
        wineType,
        row.region || null,
        country,
        grapes,
        vintage,
        alcohol,
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '{}',
        JSON.stringify({ source: 'order_ai', item_no: row.item_no }),
      ]);
      imported++;
    } catch (err) {
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);

  // Check total
  const { rows: countRows } = await pg.query('SELECT count(*) as cnt FROM wines');
  console.log(`Total wines in DB: ${countRows[0].cnt}`);

  await pg.end();
  db.close();
})();
