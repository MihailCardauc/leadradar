import { pathToFileURL } from 'node:url';
export function assessSetup(env) {
  const present = name => Boolean(env[name]?.trim());
  return {
    database: present('DATABASE_URL'),
    supabaseClient: present('NEXT_PUBLIC_SUPABASE_URL') && present('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    llm: present('OPENAI_API_KEY') && present('OPENAI_MODEL'),
    collection: present('FIRECRAWL_API_KEY'),
    crmStaticToken: present('HUBSPOT_ACCESS_TOKEN'),
    crmOAuthApp: present('HUBSPOT_CLIENT_ID') && present('HUBSPOT_CLIENT_SECRET'),
    note: 'Presence only; does not verify authentication, permissions, quota or network reachability.'
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(assessSetup(process.env), null, 2));
}
