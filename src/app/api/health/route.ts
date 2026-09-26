export function GET() {
  return Response.json({ status: 'ok', scope: 'application-process', version: 'v7', dependenciesVerified: false });
}
