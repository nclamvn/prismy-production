/**
 * Readiness Check API Route
 * Kubernetes readiness probe endpoint
 */

import { NextRequest } from 'next/server';
import { readinessCheck } from '@/lib/load-balancer/health-check';

export async function GET(request: NextRequest) {
  return readinessCheck();
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';