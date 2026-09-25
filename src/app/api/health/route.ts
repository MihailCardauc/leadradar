export function GET() {
  return Response.json({ status: 'ok', scope: 'application-process', dependenciesVerified: false });
}
