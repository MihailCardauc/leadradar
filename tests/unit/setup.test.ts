import { expect, test } from 'vitest';
import { assessSetup } from '../../scripts/check-setup.mjs';
test('readiness report never exposes credential values and rejects partial OAuth credentials', () => {
  const secret = 'sensitive-test-value';
  const result = assessSetup({ OPENAI_API_KEY: secret, OPENAI_MODEL: 'configured-model', HUBSPOT_CLIENT_ID: 'id' });
  expect(result.llm).toBe(true);
  expect(result.crmOAuthApp).toBe(false);
  expect(result.database).toBe(false);
  expect(JSON.stringify(result)).not.toContain(secret);
});
