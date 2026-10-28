import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Split,
  Quote,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { AIAnalysis, ThemeFinding } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatTimeAgo } from '../../lib/utils';
import { api } from '../../services/api';

interface AIInsightsViewProps {
  postId: string;
  initialAnalysis?: AIAnalysis | null;
  onJumpToComment?: (commentId: string) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  postId,
  initialAnalysis,
  onJumpToComment,
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const updated = await api.triggerAiAnalysis(postId);
      setAnalysis(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh AI analysis');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCategoryBadge = (category: ThemeFinding['category']) => {
    switch (category) {
      case 'complaint':
        return <Badge variant="complaint" size="sm" icon>Usability Friction</Badge>;
      case 'praise':
        return <Badge variant="praise" size="sm" icon>Community Praise</Badge>;
      case 'feature_request':
        return <Badge variant="feature" size="sm" icon>Feature Request</Badge>;
      case 'friction':
        return <Badge variant="friction" size="sm" icon>Architectural Tension</Badge>;
    }
  };

  if (!analysis) {
    return (
      <Card className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold mb-2">
          Phase 3 Scope Boundary
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          AI Research Engine Activates in Phase 3
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
          Real community contributions, persistent threaded discussions, voting, and bookmarks are active now in Phase 2. Automated qualitative thematic synthesis and evidence-backed recommendations will be activated with the Phase 3 AI Engine.
        </p>
        <Button
          onClick={() => {
            setError('The AI Research Synthesis Engine is scheduled for Phase 3. Live community discussion persistence is currently active.');
          }}
          variant="outline"
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Check AI Engine Status
        </Button>
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 max-w-md mx-auto">
            {error}
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-blue-50/30 to-transparent dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Evidence-Grounded Research Synthesis
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {analysis.modelVersion}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grounded in {analysis.commentCountAnalyzed} verified contributions · Updated{' '}
              {formatTimeAgo(analysis.createdAt)}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          isLoading={isRefreshing}
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Synthesize
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Discussion Summary */}
      <Card className="p-5 border-l-4 border-l-blue-600">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Discussion Synthesis
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {analysis.discussionSummary}
        </p>
      </Card>

      {/* Recurring Themes Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Recurring Community Themes ({analysis.themes.length})
          </h3>
          <span className="text-xs text-slate-400">Traceable to verified comments</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.themes.map((theme) => (
            <Card key={theme.id} className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {getCategoryBadge(theme.category)}
                  <span className="text-[11px] font-medium text-slate-400">
                    {theme.commentCount} {theme.commentCount === 1 ? 'citation' : 'citations'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 leading-snug">
                  {theme.themeName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  {theme.summary}
                </p>
              </div>

              {/* Citations Quote Box */}
              {theme.citations && theme.citations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {theme.citations.map((cite) => (
                    <div
                      key={cite.commentId}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 italic mb-1.5">
                        <Quote className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">"{cite.quoteSnippet}"</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>— {cite.authorDisplay}</span>
                        {onJumpToComment && (
                          <button
                            onClick={() => onJumpToComment(cite.commentId)}
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer font-medium"
                          >
                            View comment <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Community Disagreements */}
      {analysis.disagreements && analysis.disagreements.length > 0 && (
        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <Split className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Community Disagreements & Differing Viewpoints
            </h3>
          </div>

          <div className="space-y-4">
            {analysis.disagreements.map((dis) => (
              <div key={dis.id} className="text-xs space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  {dis.topic}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                    <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">
                      Perspective A:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {dis.perspectiveA}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                    <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">
                      Perspective B:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {dis.perspectiveB}
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <strong>Research Takeaway:</strong> {dis.takeaway}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Evidence-Backed Recommendations & Validation Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recommended Product Investigations ({analysis.recommendations.length})
          </h3>
          <span className="text-xs text-slate-400">Proposals for human review</span>
        </div>

        <div className="space-y-3">
          {analysis.recommendations.map((rec) => (
            <Card key={rec.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {rec.recommendedPriority}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {rec.title}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Confidence: {rec.confidence}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                <strong>Problem:</strong> {rec.problemAddressed}
              </p>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100">Evidence Rationale:</strong>{' '}
                  {rec.rationale}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong className="text-blue-900 dark:text-blue-200">Suggested Validation Step:</strong>{' '}
                  {rec.suggestedValidation}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Uncertainty and Limitations Warning */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Limitations & Uncertainty Disclosure</strong>
          <p className="leading-relaxed text-amber-700 dark:text-amber-400/90">
            {analysis.limitationsAndUncertainty}
          </p>
        </div>
      </div>
    </div>
  );
};
