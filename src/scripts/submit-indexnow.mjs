import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const keyFile = resolve('public/indexnow-key.txt');
if (!existsSync(keyFile)) {
  console.error('indexnow-key.txt not found in public directory');
  process.exit(1);
}

const key = readFileSync(keyFile, 'utf8').trim();
const host = process.env.INDEXNOW_HOST || 'nodehunt.pages.dev';
const protocol = host.startsWith('localhost') ? 'http' : 'https';
const baseUrl = `${protocol}://${host}`;

const urlsToSubmit = process.argv.slice(2);

const defaultUrls = [
  `${baseUrl}/`,
  `${baseUrl}/calculator/`,
  `${baseUrl}/articles/io-net-gpu-worker-setup-guide/`,
  `${baseUrl}/articles/eigenlayer-restaking-avs-operator-guide/`,
  `${baseUrl}/articles/bittensor-tao-subnets-node-architecture/`,
  `${baseUrl}/articles/monad-parallel-evm-node-requirements/`,
  `${baseUrl}/articles/depin-node-airdrop-farming-guide/`,
];

const finalUrls = urlsToSubmit.length > 0
  ? urlsToSubmit.map((u) => (u.startsWith('http') ? u : `${baseUrl}${u.startsWith('/') ? '' : '/'}${u}`))
  : defaultUrls;

const payload = {
  host,
  key,
  keyLocation: `${baseUrl}/indexnow-key.txt`,
  urlList: finalUrls,
};

console.log(`Submitting ${finalUrls.length} URL(s) to IndexNow for host: ${host}...`);

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = await res.text().catch(() => '');
  if (res.status === 200 || res.status === 202) {
    console.log(`✓ IndexNow accepted submission (HTTP ${res.status}). Yandex and Bing notified.`);
  } else {
    console.warn(`IndexNow responded with HTTP ${res.status}: ${body || res.statusText}`);
  }
} catch (err) {
  console.error('Failed to contact IndexNow API:', err.message);
}
