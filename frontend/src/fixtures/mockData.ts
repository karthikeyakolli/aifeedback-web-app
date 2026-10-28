import type { Post, Comment, AIAnalysis, UserProfile } from '../types';

export const mockCurrentUser: UserProfile = {
  id: 'usr_sarah_chen',
  username: 'sarahc',
  displayName: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  bio: 'Building developer tools & exploring customer research workflows.',
  reputationScore: 342,
  joinedAt: '2026-01-15T09:00:00Z',
};

export const mockPosts: Post[] = [
  {
    id: 'post_reflect_01',
    title: 'ReflectTask: Keyboard-first daily task planner. Looking for honest onboarding & sync feedback.',
    description: `I built ReflectTask over the last four months. It is designed for engineers and designers who find Notion or Jira too bloated for daily personal task velocity.

Key features:
- Modal-less quick entry (Cmd+K everywhere)
- Local-first IndexedDB persistence with cloud sync
- Integrated time blocking and Markdown notes

Where I need community critique:
1. Is the initial keyboard-shortcut onboarding intuitive, or does it feel overwhelming?
2. Several beta testers requested two-way Google Calendar sync, while others insist it should stay 100% offline.
3. How do you feel about the mobile layout when reviewing daily plans away from your desk?

Please be brutally honest. Anonymous critiques are welcome.`,
    postType: 'product_review',
    productUrl: 'https://reflecttask.dev',
    category: 'Productivity',
    tags: ['Productivity', 'Keyboard-First', 'Local-First', 'UX Review'],
    author: {
      id: 'usr_sarah_chen',
      username: 'sarahc',
      displayName: 'Sarah Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      isAnonymous: false,
      reputationScore: 342,
    },
    isAnonymous: false,
    upvotesCount: 47,
    commentsCount: 6,
    hasAiAnalysis: true,
    status: 'published',
    createdAt: '2026-10-27T10:15:00Z',
    updatedAt: '2026-10-27T10:15:00Z',
    userHasUpvoted: true,
    userHasBookmarked: true,
  },
  {
    id: 'post_querylite_02',
    title: 'QueryLite: Embedded SQLite visual inspector with zero setup. Is query latency visualizer useful?',
    description: `Most SQLite GUI tools (DB Browser, DBeaver) are either 15 years old or heavy Java/Electron apps. I wrote QueryLite in Rust + Webview.

Features:
- Instant launch (< 50ms)
- Execution plan tree visualizer
- Schema migration diff viewer

I am considering adding an automated index recommendation engine based on slow query history. Would you trust an embedded tool suggesting CREATE INDEX statements, or is that unnecessary scope creep?`,
    postType: 'idea_critique',
    productUrl: 'https://github.com/querylite/app',
    category: 'Developer Tools',
    tags: ['SQLite', 'Rust', 'Database', 'Developer Tool'],
    author: {
      username: 'anonymous',
      displayName: 'Anonymous Engineer',
      isAnonymous: true,
    },
    isAnonymous: true,
    upvotesCount: 38,
    commentsCount: 4,
    hasAiAnalysis: true,
    status: 'published',
    createdAt: '2026-10-26T16:30:00Z',
    updatedAt: '2026-10-26T16:30:00Z',
    userHasUpvoted: false,
    userHasBookmarked: false,
  },
  {
    id: 'post_docuflow_03',
    title: 'DocuFlow: SOC2 compliance evidence collector for 5-20 person startups. Review our pricing tiers.',
    description: `We automated AWS & GitHub evidence collection for SOC2 Type I & II audits. Big players charge $15k-$30k/year, which kills pre-seed startups.

We are launching a $199/month tier for up to 15 employees.
Is the pricing too cheap to be taken seriously by security officers, or is it an obvious no-brainer? What evidence integrations are dealbreakers for you?`,
    postType: 'problem_discovery',
    productUrl: 'https://docuflow.security',
    category: 'SaaS & B2B',
    tags: ['Security', 'SOC2', 'B2B', 'Pricing Strategy'],
    author: {
      id: 'usr_marcus_v',
      username: 'marcusv',
      displayName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      isAnonymous: false,
      reputationScore: 189,
    },
    isAnonymous: false,
    upvotesCount: 29,
    commentsCount: 3,
    hasAiAnalysis: false,
    status: 'published',
    createdAt: '2026-10-25T14:00:00Z',
    updatedAt: '2026-10-25T14:00:00Z',
    userHasUpvoted: false,
    userHasBookmarked: false,
  },
  {
    id: 'post_pulse_04',
    title: 'PaperPulse: AI research paper decoder with grounded mathematical proofs. Critique our workflow.',
    description: `Reading ML papers on arXiv is exhausting because author code rarely matches the paper formulas. PaperPulse parses LaTeX equations and highlights where PyTorch implementations diverge.

We need input from PhD students and research engineers: what is the most annoying part of paper reading you want solved first?`,
    postType: 'product_review',
    productUrl: 'https://paperpulse.ai',
    category: 'AI & Machine Learning',
    tags: ['ArXiv', 'Machine Learning', 'Research', 'AI Tool'],
    author: {
      username: 'anonymous',
      displayName: 'Anonymous Researcher',
      isAnonymous: true,
    },
    isAnonymous: true,
    upvotesCount: 52,
    commentsCount: 5,
    hasAiAnalysis: true,
    status: 'published',
    createdAt: '2026-10-24T18:20:00Z',
    updatedAt: '2026-10-24T18:20:00Z',
    userHasUpvoted: true,
    userHasBookmarked: false,
  },
];

export const mockComments: Record<string, Comment[]> = {
  post_reflect_01: [
    {
      id: 'cmt_001',
      postId: 'post_reflect_01',
      author: {
        username: 'anonymous',
        displayName: 'Anonymous Founder',
        isAnonymous: true,
      },
      content: 'The onboarding process is confusing. When I first loaded the screen, I was confronted with a 12-item shortcut cheat sheet with no interactive walkthrough. I had to guess how to create my first backlog bucket.',
      isAnonymous: true,
      upvotesCount: 14,
      isHelpfulFlag: true,
      createdAt: '2026-10-27T11:00:00Z',
      updatedAt: '2026-10-27T11:00:00Z',
      userHasUpvoted: true,
      replies: [
        {
          id: 'cmt_002',
          postId: 'post_reflect_01',
          parentCommentId: 'cmt_001',
          author: {
            id: 'usr_sarah_chen',
            username: 'sarahc',
            displayName: 'Sarah Chen (Creator)',
            isAnonymous: false,
          },
          content: 'This is super clear feedback. Would an interactive 3-step checklist (create task, add tag, set schedule) be better than the shortcut modal?',
          isAnonymous: false,
          upvotesCount: 5,
          isHelpfulFlag: false,
          createdAt: '2026-10-27T11:20:00Z',
          updatedAt: '2026-10-27T11:20:00Z',
        },
      ],
    },
    {
      id: 'cmt_003',
      postId: 'post_reflect_01',
      author: {
        id: 'usr_dev_dan',
        username: 'devdan',
        displayName: 'Daniel Thorne',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        isAnonymous: false,
        reputationScore: 88,
      },
      content: 'I need Google Calendar integration before I could ever switch. If my tasks do not block out real calendar slots, teammates book over my focus hours.',
      isAnonymous: false,
      upvotesCount: 11,
      isHelpfulFlag: true,
      createdAt: '2026-10-27T12:05:00Z',
      updatedAt: '2026-10-27T12:05:00Z',
      userHasUpvoted: false,
    },
    {
      id: 'cmt_004',
      postId: 'post_reflect_01',
      author: {
        username: 'anonymous',
        displayName: 'Anonymous Engineer',
        isAnonymous: true,
      },
      content: 'I disagree that calendar integration should be a priority right now; offline reliability and rock-solid local sync should come first. Once you add Google OAuth and sync conflicts, latency tanks and the app loses its core appeal.',
      isAnonymous: true,
      upvotesCount: 19,
      isHelpfulFlag: true,
      createdAt: '2026-10-27T12:45:00Z',
      updatedAt: '2026-10-27T12:45:00Z',
      userHasUpvoted: true,
    },
    {
      id: 'cmt_005',
      postId: 'post_reflect_01',
      author: {
        id: 'usr_ux_elena',
        username: 'elenaux',
        displayName: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        isAnonymous: false,
        reputationScore: 215,
      },
      content: 'The desktop app is lightning fast, but the mobile layout is very difficult to navigate with one hand. The top-left hamburger menu requires finger gymnastics on an iPhone 15 Pro.',
      isAnonymous: false,
      upvotesCount: 8,
      isHelpfulFlag: false,
      createdAt: '2026-10-27T13:30:00Z',
      updatedAt: '2026-10-27T13:30:00Z',
    },
    {
      id: 'cmt_006',
      postId: 'post_reflect_01',
      author: {
        username: 'anonymous',
        displayName: 'Anonymous Contributor',
        isAnonymous: true,
      },
      content: 'The Cmd+K command palette is fantastic. It is faster than Raycast for subtasks. Please do not ruin that simplicity with heavy settings panels.',
      isAnonymous: true,
      upvotesCount: 16,
      isHelpfulFlag: true,
      createdAt: '2026-10-27T14:10:00Z',
      updatedAt: '2026-10-27T14:10:00Z',
    },
  ],
};

export const mockAiAnalysis: Record<string, AIAnalysis> = {
  post_reflect_01: {
    id: 'run_reflect_01_v1',
    postId: 'post_reflect_01',
    modelVersion: 'gemini-1.5-flash',
    createdAt: '2026-10-27T15:00:00Z',
    commentCountAnalyzed: 6,
    discussionSummary:
      'Community discussion centers heavily on two themes: onboarding friction due to an overwhelming keyboard-shortcut sheet, and a sharp architectural debate over whether to integrate Google Calendar vs. doubling down on offline-first speed and local sync reliability. Mobile ergonomics also surfaced as a secondary friction point.',
    themes: [
      {
        id: 'thm_1',
        themeName: 'Onboarding Confusion & Shortcut Overload',
        category: 'complaint',
        summary: 'Users feel overwhelmed on first launch by an exhaustive shortcut list rather than an interactive guided flow.',
        supportingCommentIds: ['cmt_001'],
        citations: [
          {
            commentId: 'cmt_001',
            authorDisplay: 'Anonymous Founder',
            quoteSnippet: 'The onboarding process is confusing. When I first loaded the screen, I was confronted with a 12-item shortcut cheat sheet...',
          },
        ],
        commentCount: 1,
        severity: 'high',
      },
      {
        id: 'thm_2',
        themeName: 'Calendar Sync vs. Offline Core Debate',
        category: 'friction',
        summary: 'A pronounced split between schedule-driven knowledge workers demanding Google Calendar and performance purists advocating for offline reliability.',
        supportingCommentIds: ['cmt_003', 'cmt_004'],
        citations: [
          {
            commentId: 'cmt_003',
            authorDisplay: 'Daniel Thorne',
            quoteSnippet: 'I need Google Calendar integration before I could ever switch. If my tasks do not block out real calendar slots...',
          },
          {
            commentId: 'cmt_004',
            authorDisplay: 'Anonymous Engineer',
            quoteSnippet: 'I disagree that calendar integration should be a priority right now; offline reliability and rock-solid local sync should come first.',
          },
        ],
        commentCount: 2,
        severity: 'high',
      },
      {
        id: 'thm_3',
        themeName: 'Praise for Keyboard Command Velocity',
        category: 'praise',
        summary: 'Strong endorsement for the Cmd+K command palette, highlighting that it outperforms competing launcher workflows.',
        supportingCommentIds: ['cmt_006'],
        citations: [
          {
            commentId: 'cmt_006',
            authorDisplay: 'Anonymous Contributor',
            quoteSnippet: 'The Cmd+K command palette is fantastic. It is faster than Raycast for subtasks.',
          },
        ],
        commentCount: 1,
        severity: 'low',
      },
      {
        id: 'thm_4',
        themeName: 'Mobile Navigation Ergonomics',
        category: 'complaint',
        summary: 'One-handed navigation on modern mobile viewports is hindered by top-left menu positioning.',
        supportingCommentIds: ['cmt_005'],
        citations: [
          {
            commentId: 'cmt_005',
            authorDisplay: 'Elena Rostova',
            quoteSnippet: '...the mobile layout is very difficult to navigate with one hand. The top-left hamburger menu requires finger gymnastics...',
          },
        ],
        commentCount: 1,
        severity: 'medium',
      },
    ],
    disagreements: [
      {
        id: 'dis_1',
        topic: 'External Google Calendar Integration vs. Offline Isolation',
        perspectiveA: 'Calendar sync is mandatory to prevent schedule collisions during corporate focus blocks (Daniel Thorne).',
        supportingIdsA: ['cmt_003'],
        perspectiveB: 'Calendar OAuth and external sync introduce latency, conflict headaches, and compromise offline reliability (Anonymous Engineer).',
        supportingIdsB: ['cmt_004'],
        takeaway: 'Consider a read-only one-way ICS export or local calendar viewer before committing to complex two-way OAuth sync.',
      },
    ],
    recommendations: [
      {
        id: 'rec_1',
        title: 'Replace shortcut cheat sheet with 3-step interactive onboarding sandbox',
        problemAddressed: 'New users bounce due to immediate cognitive shortcut overload.',
        rationale: 'Validated by direct feedback (cmt_001) with 14 community upvotes endorsing the friction.',
        suggestedValidation: 'A/B test an interactive first-run checklist vs. the static modal and track Day-1 task completion rates.',
        supportingCommentIds: ['cmt_001'],
        frequencyScore: 1,
        confidence: 'high',
        recommendedPriority: 'P1',
      },
      {
        id: 'rec_2',
        title: 'Evaluate read-only calendar feed before full bidirectional sync',
        problemAddressed: 'Customer divide between calendar availability and offline performance speed.',
        rationale: 'Supported by contrasting viewpoints (cmt_003 vs cmt_004). Avoids premature architectural bloat while addressing scheduling visibility.',
        suggestedValidation: 'Survey current beta users on whether a read-only local calendar overlay satisfies 80% of scheduling needs.',
        supportingCommentIds: ['cmt_003', 'cmt_004'],
        frequencyScore: 2,
        confidence: 'medium',
        recommendedPriority: 'P2',
      },
      {
        id: 'rec_3',
        title: 'Relocate mobile navigation anchors to bottom thumb zone',
        problemAddressed: 'One-handed reachability friction on mobile devices.',
        rationale: 'Direct UX issue raised by cmt_005.',
        suggestedValidation: 'Prototype bottom tab bar on mobile viewport and measure task switching completion time.',
        supportingCommentIds: ['cmt_005'],
        frequencyScore: 1,
        confidence: 'medium',
        recommendedPriority: 'P2',
      },
    ],
    limitationsAndUncertainty:
      'Analysis is grounded in 6 community contributions. Statistical sample size is limited. While the onboarding and calendar tensions have clear qualitative signal, quantitative prioritization should be validated as comment volume scales.',
    isCached: true,
  },
};
