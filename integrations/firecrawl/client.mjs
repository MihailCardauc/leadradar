import { Firecrawl } from 'firecrawl';
import { createHash } from 'node:crypto';

function client() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('Set FIRECRAWL_API_KEY in the backend environment.');
  return new Firecrawl({ apiKey });
}

// Discovery results are candidates, not verified buying signals.
export async function discoverSources(query) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('A search query is required.');
  const result = await client().search(query, { sources: ['web'], limit: 5, timeout: 30000 });
  return result.web ?? [];
}

// Call from a backend worker, never from the browser. Use vetted public URLs.
export async function scrapeEvidence(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('Provide a public HTTPS URL without embedded credentials.');
  }
  const doc = await client().scrape(parsed.href, {
    formats: ['markdown'], onlyMainContent: true, maxAge: 3600000, timeout: 30000
  });
  if (!doc.markdown?.trim()) throw new Error('No page text returned; do not score this as a negative signal.');
  if (doc.metadata?.statusCode >= 400) throw new Error('Source page returned an HTTP error.');
  return {
    sourceUrl: doc.metadata?.sourceURL ?? parsed.href,
    requestedUrl: parsed.href,
    retrievedAt: new Date().toISOString(),
    publishedAt: null,
    contentHash: createHash('sha256').update(doc.markdown).digest('hex'),
    markdown: doc.markdown,
    metadata: doc.metadata ?? {},
    verificationStatus: 'unreviewed'
  };
}
