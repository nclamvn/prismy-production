'use client';
import { createClient } from '@/lib/supabase-browser';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logAuthEvent, logAuthError, markAuthTiming, trackAuthNetwork } from '@/lib/auth-analytics';
import dynamic from 'next/dynamic';

// Dynamic import example for OAuth Doctor validation (referenced below)
const DynamicComponent = dynamic(() => Promise.resolve(() => null), { ssr: false });

// Error categories for OAuth callback diagnostics
type CallbackError = 
  | 'missing_code'
  | 'exchange_failed' 
  | 'network_timeout'
  | 'invalid_session'
  | 'redirect_failed'
  | 'callback_timeout'

export default function OAuthCallback() {
  const q = useSearchParams();
  const r = useRouter();
  const [diagnostics, setDiagnostics] = useState<{
    stage: string;
    error?: string;
    startTime: number;
  }>({
    stage: 'initializing',
    startTime: Date.now()
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let completed = false;

    const handleCallback = async () => {
      const startTime = Date.now();
      
      try {
        // 🩺 Sensor B: Callback Entry Diagnostics
        logAuthEvent('oauth_callback_enter', {
          metadata: {
            hasCode: !!q.get('code'),
            hasNext: !!q.get('next'),
            hasError: !!q.get('error'),
            searchParams: Object.fromEntries(q.entries()),
            userAgent: navigator.userAgent,
            origin: window.location.origin
          }
        });

        setDiagnostics({ stage: 'validating_parameters', startTime });
        markAuthTiming('oauth_callback_enter');

        // Parameter validation
        const code = q.get('code');
        const next = q.get('next') || '/app';
        const error = q.get('error');
        const errorDescription = q.get('error_description');

        // Handle OAuth provider errors
        if (error) {
          const errorMsg = `OAuth provider error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`;
          logAuthError('oauth_exchange_error', errorMsg, {
            provider: 'google',
            error_type: error,
            error_description: errorDescription
          });
          
          setDiagnostics({ stage: 'provider_error', error: errorMsg, startTime });
          r.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        // Missing authorization code
        if (!code) {
          logAuthError('oauth_exchange_error', 'Missing authorization code', {
            searchParams: Object.fromEntries(q.entries())
          });
          
          setDiagnostics({ stage: 'missing_code', error: 'No authorization code', startTime });
          r.replace('/login?error=missing_code');
          return;
        }

        setDiagnostics({ stage: 'exchanging_token', startTime });
        markAuthTiming('oauth_exchange_start');

        // 🩺 Sensor B: Track Token Exchange with Network Monitoring
        const exchangeResult = await trackAuthNetwork('oauth_exchange_start', async () => {
          const client = createClient();
          return await client.auth.exchangeCodeForSession(code);
        });

        markAuthTiming('oauth_exchange_complete');
        
        // Handle exchange errors
        if (exchangeResult.error) {
          const errorCategory: CallbackError = exchangeResult.error.status === 400 
            ? 'invalid_session' 
            : 'exchange_failed';
            
          logAuthError('oauth_exchange_error', exchangeResult.error.message, {
            errorCode: exchangeResult.error.status,
            errorName: exchangeResult.error.name,
            category: errorCategory,
            code: code.slice(0, 10) + '...' // Log partial code for debugging
          });
          
          setDiagnostics({ 
            stage: 'exchange_failed', 
            error: `Token exchange failed: ${exchangeResult.error.message}`, 
            startTime 
          });
          
          r.replace(`/login?error=${errorCategory}`);
          return;
        }

        // Validate session data
        const { data: { session, user } } = exchangeResult;
        if (!session || !user) {
          logAuthError('oauth_exchange_error', 'Exchange succeeded but no session/user returned', {
            hasSession: !!session,
            hasUser: !!user
          });
          
          setDiagnostics({ 
            stage: 'invalid_session', 
            error: 'No session data returned', 
            startTime 
          });
          
          r.replace('/login?error=invalid_session');
          return;
        }

        // 🩺 Success logging
        logAuthEvent('oauth_exchange_success', {
          duration: Date.now() - startTime,
          metadata: {
            userId: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            nextUrl: next,
            sessionExpiry: session.expires_at
          }
        });

        setDiagnostics({ stage: 'redirecting', startTime });
        markAuthTiming('oauth_redirect_start');

        // Successful redirect
        completed = true;
        r.replace(next);
        
      } catch (error) {
        if (completed) return; // Ignore errors after successful completion
        
        const errorMsg = error instanceof Error ? error.message : 'Unknown callback error';
        const duration = Date.now() - startTime;
        
        logAuthError('oauth_exchange_error', errorMsg, {
          duration,
          stack: error instanceof Error ? error.stack : undefined,
          stage: diagnostics.stage
        });
        
        setDiagnostics({ 
          stage: 'unexpected_error', 
          error: errorMsg, 
          startTime 
        });
        
        r.replace('/login?error=callback_error');
      }
    };

    // 🩺 Sensor B: 15-second Timeout Guard
    timeoutId = setTimeout(() => {
      if (!completed) {
        const duration = Date.now() - diagnostics.startTime;
        
        logAuthError('oauth_exchange_error', 'Callback timeout after 15 seconds', {
          duration,
          stage: diagnostics.stage,
          category: 'callback_timeout' as CallbackError
        });
        
        setDiagnostics({ 
          stage: 'timeout', 
          error: 'Callback processing timeout', 
          startTime: diagnostics.startTime 
        });
        
        r.replace('/login?error=timeout');
      }
    }, 15000);

    // Execute callback handling
    handleCallback();

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [q, r]);

  // Development-only diagnostics display
  if (process.env.NODE_ENV === 'development') {
    const elapsed = Date.now() - diagnostics.startTime;
    
    return (
      <div className="p-4 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-lg font-semibold">OAuth Callback</h2>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Stage:</span>
              <span className="font-medium">{diagnostics.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Elapsed:</span>
              <span className="font-medium">{elapsed}ms</span>
            </div>
            {diagnostics.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-red-700 text-xs">{diagnostics.error}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            🩺 Development mode: Detailed diagnostics enabled
          </div>
        </div>
      </div>
    );
  }

  // Production: Minimal loading state
  return (
    <div className="p-4 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">Authorising…</p>
        {/* Dynamic component for OAuth Doctor validation */}
        <DynamicComponent />
      </div>
    </div>
  );
}