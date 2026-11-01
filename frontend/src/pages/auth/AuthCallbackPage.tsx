import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { setStoredToken } from '../../services/api';
import { Button } from '../../components/common/Button';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check for error parameters in query or hash
      const errorDescription = searchParams.get('error_description') || searchParams.get('error');
      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          if (data.session) {
            setStoredToken(data.session.access_token);
            navigate('/', { replace: true });
            return;
          }

          // If no session yet, listen once for auth state change
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              setStoredToken(session.access_token);
              navigate('/', { replace: true });
            }
          });

          // Timeout safety: if still unauthenticated after 4 seconds, show recovery
          const timer = setTimeout(() => {
            setError('Authentication session could not be verified. Please try signing in directly.');
          }, 4000);

          return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(timer);
          };
        } catch (err: any) {
          setError(err.message || 'Failed to complete authentication exchange.');
        }
      } else {
        // Fallback or dev mock redirect
        navigate('/', { replace: true });
      }
    };

    handleAuthRedirect();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="w-full max-w-sm p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-xs">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Verification Issue
              </h1>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                {error}
              </p>
            </div>
            <Link to="/login" className="block pt-2">
              <Button size="md" variant="primary" className="w-full justify-center">
                Return to Sign In <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying authentication token...</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Establishing your secure workspace session. You will be redirected momentarily.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

