import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { context, load, failure, AppError } from '../../../server/store';
export async function POST(request: Request) {
  try {
    // MCP integrations require an explicit bearer token; never reuse a browser demo cookie.
    if (!request.headers.get('authorization')) throw new AppError(401,'Supabase bearer token and x-tenant-id required');
    const ctx = await context(request); const w = await load(ctx);
    const server = new McpServer({ name: 'leadradar', version: '0.2.0' });
    server.registerTool('search_accounts', { description: 'Search authorized company-service evaluations. Scores are not purchase probabilities.', inputSchema: { query: z.string().max(160).optional(), serviceId: z.string().optional() }, annotations: { readOnlyHint: true } }, async ({query,serviceId}) => {
      const companies = w.companies.filter(c => c.name.toLowerCase().includes((query ?? '').toLowerCase()));
      return { content: [{ type: 'text', text: JSON.stringify({ revision: w.revision, companies, evaluations: w.evaluations.filter(e => companies.some(c => c.id === e.companyId) && (!serviceId || e.serviceId === serviceId)) }) }] };
    });
    server.registerTool('explain_score', { description: 'Return the exact stored dashboard evaluation and cited evidence.', inputSchema: { companyId: z.string(), serviceId: z.string(), evaluationId: z.string().optional() }, annotations: { readOnlyHint: true } }, async ({companyId,serviceId,evaluationId}) => {
      const evaluation = (evaluationId ? [...w.evaluations,...(w.evaluationHistory ?? [])] : w.evaluations).find(e => e.companyId === companyId && e.serviceId === serviceId && (!evaluationId || e.id === evaluationId));
      return { isError: !evaluation, content: [{ type: 'text', text: JSON.stringify(evaluation ? { revision: w.revision, evaluation, evidence: w.evidence.filter(e => evaluation.contributions.some(c => c.evidenceIds.includes(e.id))) } : { error: 'Evaluation not found' }) }] };
    });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true }); await server.connect(transport);
    const response = await transport.handleRequest(request); const bytes = await response.arrayBuffer(); await server.close();
    return new Response(bytes,{status:response.status,headers:response.headers});
  } catch(e) { return failure(e); }
}
