import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { context, load, failure, AppError } from '../../../server/store';
import { priorities, decisionFor, command } from '../../../server/service';
import { explain } from '../../../domain/decision';

/**
 * Product MCP (read-only first). Tools return the stored evaluation and configuration, never a recalculated score.
 * Requires a Supabase bearer token and x-tenant-id; the browser demo cookie is never accepted here.
 */
export async function POST(request: Request) {
  try {
    if (!request.headers.get('authorization')) throw new AppError(401, 'Supabase bearer token and x-tenant-id required');
    const ctx = await context(request); const w = await load(ctx);
    const server = new McpServer({ name: 'leadradar', version: '0.7.0' });
    server.registerTool('search_opportunities', { description: 'Search stored company-service evaluations with stage, momentum and proposed next step. Scores are priorities, not purchase probabilities.', inputSchema: { query: z.string().max(160).optional(), serviceId: z.string().optional(), band: z.enum(['hot', 'warm', 'monitor']).optional(), limit: z.number().int().min(1).max(100).default(25) }, annotations: { readOnlyHint: true } }, async ({ query, serviceId, band, limit }) => {
      const rows = priorities(w, ctx, serviceId).filter(r => (!query || r.company.toLowerCase().includes(query.toLowerCase())) && (!band || r.band === band)).slice(0, limit);
      return { content: [{ type: 'text', text: JSON.stringify({ revision: w.revision, updatedAt: w.evaluations[0]?.evaluatedAt ?? null, rows }) }] };
    });
    server.registerTool('explain_product_score', { description: 'Return F/R/N/P/K/C, contributions, gates, evidence IDs, prediction rationale and versions for one stored evaluation.', inputSchema: { companyId: z.string(), serviceId: z.string(), evaluationId: z.string().optional() }, annotations: { readOnlyHint: true } }, async ({ companyId, serviceId, evaluationId }) => {
      const evaluation = (evaluationId ? [...w.evaluations, ...(w.evaluationHistory ?? [])] : w.evaluations).find(e => e.companyId === companyId && e.serviceId === serviceId && (!evaluationId || e.id === evaluationId));
      const service = w.services.find(s => s.id === serviceId);
      const prediction = evaluation ? w.predictions!.find(p => p.evaluationId === evaluation.id) : undefined;
      return { isError: !evaluation, content: [{ type: 'text', text: JSON.stringify(evaluation && service ? { revision: w.revision, evaluation, prediction, explanation: explain(evaluation, service), evidence: w.evidence.filter(e => evaluation.contributions.some(c => c.evidenceIds.includes(e.id))).map(e => ({ id: e.id, quote: e.quote, url: e.url, eventDate: e.eventDate, retrievedAt: e.retrievedAt, sourceType: e.sourceType, status: e.status })) } : { error: 'Evaluation not found' }) }] };
    });
    server.registerTool('what_if_without_evidence', { description: 'Counterfactual: recompute P without each supporting piece of evidence (or one given evidenceId) at the stored evaluation time. Nothing is saved.', inputSchema: { companyId: z.string(), serviceId: z.string(), evidenceId: z.string().optional() }, annotations: { readOnlyHint: true } }, async ({ companyId, serviceId, evidenceId }) => {
      try { const { result } = await command(ctx, { type: 'counterfactual', payload: { companyId, serviceId, evidenceId } }); return { content: [{ type: 'text', text: JSON.stringify(result) }] }; }
      catch (e) { return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: (e as Error).message }) }] }; }
    });
    server.registerTool('get_tender_brief', { description: 'Return a stored tender dossier (procedure, lots, deadline, status, relevant services, provisional T score).', inputSchema: { tenderId: z.string() }, annotations: { readOnlyHint: true } }, async ({ tenderId }) => {
      const t = w.tenders!.find(t => t.id === tenderId);
      return { isError: !t, content: [{ type: 'text', text: JSON.stringify(t ? { ...t, text: undefined } : { error: 'Tender not found' }) }] };
    });
    server.registerTool('propose_crm_action', { description: 'Build (do not execute) the Decision Case and next best action for a company-service pair. Nothing is written to any CRM.', inputSchema: { companyId: z.string(), serviceId: z.string() }, annotations: { readOnlyHint: true } }, async ({ companyId, serviceId }) => {
      try { const d = decisionFor(structuredClone(w), companyId, serviceId, ctx); return { content: [{ type: 'text', text: JSON.stringify({ proposal: d, executed: false }) }] }; }
      catch (e) { return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: (e as Error).message }) }] }; }
    });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true }); await server.connect(transport);
    const response = await transport.handleRequest(request); const bytes = await response.arrayBuffer(); await server.close();
    return new Response(bytes, { status: response.status, headers: response.headers });
  } catch (e) { return failure(e); }
}
