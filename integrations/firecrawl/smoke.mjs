import { mkdir, writeFile } from 'node:fs/promises';
import { scrapeEvidence } from './client.mjs';

try {
  const evidence = await scrapeEvidence('https://firecrawl.dev');
  const cache = new URL('../../.firecrawl/', import.meta.url);
  await mkdir(cache, { recursive: true });
  await writeFile(new URL('sdk-smoke.json', cache), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ success: true, characters: evidence.markdown.length, contentHash: evidence.contentHash }));
} catch (error) {
  // SDK errors can carry request configuration; do not log the raw error.
  console.error('Firecrawl smoke test failed. Check the backend key, quota, and network connection.');
  process.exitCode = 1;
}
