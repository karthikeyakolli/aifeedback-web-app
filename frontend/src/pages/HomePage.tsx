import React, { useEffect, useState, useMemo } from 'react';
import type { PublicProject } from '../types';
import { api } from '../services/api';
import { Hero3D } from '../components/home/Hero3D';
import { AboutSection } from '../components/home/AboutSection';
import { CommunityVoices } from '../components/home/CommunityVoices';
import { ProductCarousel } from '../components/home/ProductCarousel';
import { HomeSearchSection } from '../components/home/HomeSearchSection';
import { ExploreByDomain } from '../components/home/ExploreByDomain';
import { RecommendedProjects } from '../components/home/RecommendedProjects';
import { HomeFooter } from '../components/home/HomeFooter';

export const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getPublicProjects({ limit: 50 })
      .then((data) => {
        if (isMounted) {
          setProjects(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load homepage projects:', err);
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Section C: Trending (highest score: upvotes + discussions)
  const trendingProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const scoreA = (a.upvotesCount || 0) * 2 + (a.reviewsCount || 0) * 3;
      const scoreB = (b.upvotesCount || 0) * 2 + (b.reviewsCount || 0) * 3;
      return scoreB - scoreA;
    });
  }, [projects]);

  // Section D: New Projects (chronological newest)
  const newProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projects]);

  // Section E: Most Discussed (highest review / discussion count)
  const mostDiscussedProjects = useMemo(() => {
    return [...projects].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  }, [projects]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      {/* Section A: 3D Hero */}
      <Hero3D />

      {/* Section B: About Platform */}
      <AboutSection />

      {/* Section C: Community Voices */}
      <CommunityVoices />

      {/* Section C: Trending Projects */}
      <ProductCarousel
        title="Trending Projects"
        subtitle="Applications generating high community engagement and discussions"
        projects={trendingProjects}
        isLoading={isLoading}
        type="trending"
        viewAllLink="/explore?sort=trending"
      />

      {/* Section D: New Projects */}
      <ProductCarousel
        title="New Projects"
        subtitle="Fresh applications recently published by creators"
        projects={newProjects}
        isLoading={isLoading}
        type="new"
        viewAllLink="/explore?sort=new"
      />

      {/* Section E: Most Discussed Projects */}
      <ProductCarousel
        title="Most Discussed Projects"
        subtitle="Ranked by genuine community dialogue and feedback volume"
        projects={mostDiscussedProjects}
        isLoading={isLoading}
        type="most_discussed"
        viewAllLink="/explore?sort=most_discussed"
      />

      {/* Section F: Search & Explore */}
      <HomeSearchSection projects={projects} />

      {/* Section G: Explore by Domain */}
      <ExploreByDomain projects={projects} />

      {/* Section H: Recommended Projects */}
      <RecommendedProjects projects={trendingProjects} />

      {/* Section I: Footer */}
      <HomeFooter />
    </div>
  );
};
