/**
 * Liveness Check API Route
 * Kubernetes liveness probe endpoint
 */

import { NextRequest } from 'next/server';
import { livenessCheck } from '@/lib/load-balancer/health-check';

export async function GET(request: NextRequest) {
  return livenessCheck();
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';