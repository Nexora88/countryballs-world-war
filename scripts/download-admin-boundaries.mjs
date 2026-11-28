#!/usr/bin/env node
/**
 * Fetch country-level geoBoundaries gbOpen GeoJSON files.
 * Node.js 18+; no third-party dependencies.
 *
 * Examples:
 *   node scripts/download-admin-boundaries.mjs --levels=ADM1,ADM2
 *   node scripts/download-admin-boundaries.mjs --iso=TUR,USA --levels=ADM1,ADM2
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'admin-boundaries');
const API = 'https://www.geoboundaries.org/api/current/gbOpen';
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=') || 'true'];
}));
const levels = (args.levels || 'ADM1').split(',').map((v) => v.toUpperCase());
const isoFilter = args.iso ? new Set(args.iso.split(',').map((v) => v.toUpperCase())) : null;
const detail = args.detail === 'full' ? 'full' : 'simplified';
const concurrency = Math.max(1, Math.min(12, Number(args.concurrency || 5)));
const dryRun = args['dry-run'] === 'true';

let failures = 0;

for (const level of levels) {
  if (!/^ADM[1-5]$/.test(level)) throw new Error('Desteklenen seviyeler: ADM1–ADM5');
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Countryballs-Sovereign-DataImporter/1.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

await mkdir(OUT, { recursive: true });
const manifestPath = path.join(OUT, 'manifest.json');
let manifest = { schemaVersion: 1, provider: 'geoBoundaries gbOpen', api: API, generatedAt: null, datasets: {} };
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}

for (const level of levels) {
  console.log(`[catalog] ${level}`);
  const catalog = await getJson(`${API}/ALL/${level}/`);
  const entries = Array.isArray(catalog) ? catalog : (catalog.boundaries || catalog.data || []);
  const selected = [...new Map(entries.filter((item) => item.boundaryISO)
    .filter((item) => !isoFilter || isoFilter.has(item.boundaryISO))
    .map((item) => [item.boundaryISO, item])).values()];
  console.log(`[catalog] ${selected.length} country codes found`);
  const levelDir = path.join(OUT, level);
  await mkdir(levelDir, { recursive: true });
  manifest.datasets[level] ||= {};

  await mapLimit(selected, concurrency, async (catalogMetadata) => {
    const iso = catalogMetadata.boundaryISO;
    try {
      const metadata = catalogMetadata.gjDownloadURL ? catalogMetadata : await getJson(`${API}/${iso}/${level}/`);
      const url = detail === 'full'
        ? metadata.gjDownloadURL
        : (metadata.simplifiedGeometryGeoJSON || metadata.gjDownloadURL);
      if (!url) {
        console.warn(`[skip] ${iso} ${level}: no GeoJSON URL`);
        return;
      }
      const record = {
        iso,
        level,
        name: metadata.boundaryName || iso,
        year: metadata.boundaryYearRepresented || null,
        source: metadata.boundarySource || null,
        sourceUpdateDate: metadata.sourceDataUpdateDate || null,
        license: metadata.boundaryLicense || 'See geoBoundaries metadata',
        licenseDetail: metadata.licenseDetail || null,
        licenseSource: metadata.licenseSource || null,
        boundaryId: metadata.boundaryID || null,
        featureCount: metadata.admUnitCount ?? null,
        detail,
        downloadUrl: url,
        file: `data/admin-boundaries/${level}/${iso}.geojson`
      };
      if (dryRun) {
        manifest.datasets[level][iso] = record;
        console.log(`[dry-run] ${iso} ${level} — ${record.name}`);
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
      const geometry = await response.json();
      if (!geometry || !['FeatureCollection', 'Feature'].includes(geometry.type)) {
        throw new Error('Beklenmeyen GeoJSON yapısı');
      }
      const filePath = path.join(levelDir, `${iso}.geojson`);
      await writeFile(filePath, JSON.stringify(geometry));
      record.downloadedAt = new Date().toISOString();
      record.bytes = Buffer.byteLength(JSON.stringify(geometry));
      manifest.datasets[level][iso] = record;
      console.log(`[ok] ${iso} ${level} — ${record.featureCount ?? '?'} birim`);
    } catch (error) {
      failures += 1;
      console.error(`[error] ${iso} ${level}: ${error.message}`);
    }
  });
}

manifest.generatedAt = new Date().toISOString();
manifest.attribution = 'Contains geoBoundaries data; see per-dataset source and license metadata. Attribution required.';
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
if (failures > 0) {
  console.error(`${failures} dataset(s) failed. Check the errors above before using this manifest.`);
  process.exitCode = 1;
}
