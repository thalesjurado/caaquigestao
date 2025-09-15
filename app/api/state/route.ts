import { redis } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const KEY = 'projectops:state:v1';

export async function GET() {
  const data = await redis.get(KEY);
  return Response.json(data ?? null, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: Request) {
  const body = await req.json();
  await redis.set(KEY, body);
  return Response.json({ ok: true });
}