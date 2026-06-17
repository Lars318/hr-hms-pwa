export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    environment: process.env.ENVIRONMENT,
    appUrl: process.env.APP_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
