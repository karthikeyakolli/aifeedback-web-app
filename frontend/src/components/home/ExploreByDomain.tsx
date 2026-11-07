import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  CheckSquare,
  Terminal,
  GraduationCap,
  Palette,
  Briefcase,
  Tv,
  GitBranch,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { PublicProject } from '../../types';

interface ExploreByDomainProps {
  projects: PublicProject[];
}

interface DomainConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  categoryFilter: string;
}

const DOMAINS: DomainConfig[] = [
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Neural networks, autonomous agents, RAG engines, and multimodal intelligence systems.',
    icon: Cpu,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    categoryFilter: 'ai-ml',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Task workflows, note taking, keyboard-centric utilities, and team coordination engines.',
    icon: CheckSquare,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    categoryFilter: 'productivity',
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    description: 'IDEs, compilers, debuggers, CLI frameworks, and modern software engineering toolchains.',
    icon: Terminal,
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    categoryFilter: 'developer-tools',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Interactive learning, tutoring systems, STEM simulations, and spaced repetition tutors.',
    icon: GraduationCap,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    categoryFilter: 'education',
  },
  {
    id: 'design-ux',
    name: 'Design & Creativity',
    description: 'Vector illustration, UX design systems, 3D graphics tools, and generative canvas suites.',
    icon: Palette,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    categoryFilter: 'design-ux',
  },
  {
    id: 'business-finance',
    name: 'Business & Finance',
    description: 'Invoicing, SaaS metrics, payroll, portfolio management, and accounting automations.',
    icon: Briefcase,
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    categoryFilter: 'saas-b2b',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Audio engines, streaming media, game development experiments, and creative recreation.',
    icon: Tv,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    categoryFilter: 'entertainment',
  },
  {
    id: 'open-source',
    name: 'Open Source',
    description: 'Permissively licensed codebases, community forks, public libraries, and kernel tooling.',
    icon: GitBranch,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    categoryFilter: 'infrastructure',
  },
  {
    id: 'other',
    name: 'Other Applications',
    description: 'Experimental utilities, niche appliances, smart home bridges, and specialized software.',
    icon: Layers,
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    categoryFilter: 'mobile',
  },
];

export const ExploreByDomain: React.FC<ExploreByDomainProps> = ({ projects }) => {
  return (
    <section className="w-full py-14 border-b border-[var(--border-default)]/60 bg-[var(--surface)]" aria-label="Explore by Domain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Domain Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Explore by Application Domain
            </h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline shrink-0"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 9 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            const count = projects.filter((p) => p.category === domain.categoryFilter).length;

            return (
              <Link
                key={domain.id}
                to={`/explore?category=${domain.categoryFilter}`}
                className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${domain.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                      {count} {count === 1 ? 'project' : 'projects'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                    {domain.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    {domain.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] pt-2 border-t border-[var(--border-default)]/40 group-hover:translate-x-1 transition-transform">
                  <span>Explore domain</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

