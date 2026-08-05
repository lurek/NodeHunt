import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const dist = resolve('dist');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );

const files = walk(dist).filter((file) => file.endsWith('.html'));
const targets = new Set(walk(dist).map((file) => file.slice(dist.length).replace(/\\/g, '/')));

const attrRe = /\b(href|src|poster)="([^"]+)"/g;
const srcsetRe = /\bsrcset="([^"]+)"/g;
const idRe = /id="([^"]+)"/g;

const idCache = new Map();
function idsOf(targetPath) {
  if (!idCache.has(targetPath)) {
    const absolute = join(dist, targetPath);
    idCache.set(targetPath, new Set([...readFileSync(absolute, 'utf8').matchAll(idRe)].map((m) => m[1])));
  }
  return idCache.get(targetPath);
}

function toTargetPath(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return '/index.html';
  let path = clean.startsWith('/') ? clean : `/${clean}`;
  if (path.endsWith('/')) path += 'index.html';
  else if (!extname(path)) path += '/index.html';
  return path;
}

let failures = 0;

const report = (source, message) => {
  failures += 1;
  console.error(`  ${source} → ${message}`);
};

for (const file of files) {
  const source = file.slice(dist.length);
  const raw = readFileSync(file, 'utf8');
  const html = raw.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const pageIds = idsOf(source);

  for (const match of html.matchAll(srcsetRe)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (!url) continue;
      if (!targets.has(toTargetPath(url))) report(source, `missing srcset asset: ${url}`);
    }
  }

  for (const [, attr, value] of html.matchAll(attrRe)) {
    if (value.startsWith('#') || value.startsWith('?') || value.startsWith('data:')) {
      if (attr === 'href' && value.startsWith('#') && !pageIds.has(value.slice(1))) {
        report(source, `missing same-page anchor: ${value}`);
      }
      continue;
    }
    if (/^(?:[a-z]+:)?\/\//.test(value) || value.startsWith('mailto:') || value.startsWith('tel:')) continue;

    const [path, hash] = value.split('#');
    const target = toTargetPath(path);
    if (!targets.has(target)) {
      report(source, `missing ${attr}: ${value}`);
      continue;
    }
    if (hash && attr === 'href' && !idsOf(target).has(hash)) {
      report(source, `missing anchor ${hash} on ${target}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nLink check failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log(`Link check passed: ${files.length} HTML files, all internal links and assets resolve.`);
