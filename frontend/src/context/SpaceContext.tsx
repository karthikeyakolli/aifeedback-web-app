import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppSpace = 'public' | 'personal' | 'creator';

export interface SpaceMetadata {
  id: AppSpace;
  label: string;
  shortDescription: string;
  badge: string;
  defaultRoute: string;
}

export const SPACES: Record<AppSpace, SpaceMetadata> = {
  public: {
    id: 'public',
    label: 'Public',
    shortDescription: 'Community products, launches & open feedback',
    badge: 'Open Discovery',
    defaultRoute: '/public',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    shortDescription: 'Private workspace, AI reviews & project roadmap',
    badge: 'Private & Encrypted',
    defaultRoute: '/personal',
  },
  creator: {
    id: 'creator',
    label: 'Creator',
    shortDescription: 'Showcases, templates & public maker presentation',
    badge: 'Portfolio Studio',
    defaultRoute: '/creator',
  },
};

interface SpaceContextType {
  currentSpace: AppSpace;
  switchSpace: (space: AppSpace, navigateToDefault?: boolean) => void;
  metadata: SpaceMetadata;
  // Contextual Right Inspector State (280-340px)
  isInspectorOpen: boolean;
  inspectorTitle: string | null;
  inspectorContent: React.ReactNode | null;
  openInspector: (content: React.ReactNode, title?: string) => void;
  closeInspector: () => void;
  toggleInspector: () => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Deduce initial space from URL path or local preference
  const deduceSpaceFromPath = (path: string): AppSpace => {
    if (path.startsWith('/personal')) return 'personal';
    if (path.startsWith('/creator')) return 'creator';
    return 'public';
  };

  const [currentSpace, setCurrentSpace] = useState<AppSpace>(() => {
    const fromPath = deduceSpaceFromPath(window.location.pathname);
    if (fromPath !== 'public') return fromPath;
    const saved = localStorage.getItem('pri_active_space') as AppSpace;
    return saved && ['public', 'personal', 'creator'].includes(saved) ? saved : 'public';
  });

  // Keep space in sync with URL location
  useEffect(() => {
    const deduced = deduceSpaceFromPath(location.pathname);
    if (deduced !== currentSpace) {
      setCurrentSpace(deduced);
      localStorage.setItem('pri_active_space', deduced);
    }
  }, [location.pathname]);

  const switchSpace = useCallback(
    (space: AppSpace, navigateToDefault = true) => {
      setCurrentSpace(space);
      localStorage.setItem('pri_active_space', space);
      if (navigateToDefault) {
        navigate(SPACES[space].defaultRoute);
      }
    },
    [navigate]
  );

  // Inspector state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTitle, setInspectorTitle] = useState<string | null>(null);
  const [inspectorContent, setInspectorContent] = useState<React.ReactNode | null>(null);

  const openInspector = useCallback((content: React.ReactNode, title?: string) => {
    setInspectorContent(content);
    if (title) setInspectorTitle(title);
    setIsInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setIsInspectorOpen(false);
  }, []);

  const toggleInspector = useCallback(() => {
    setIsInspectorOpen((prev) => !prev);
  }, []);

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        switchSpace,
        metadata: SPACES[currentSpace],
        isInspectorOpen,
        inspectorTitle,
        inspectorContent,
        openInspector,
        closeInspector,
        toggleInspector,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = (): SpaceContextType => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};

