import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Compass, Plus, Sparkles, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export const Hero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 3, 50); // Indigo
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2.5, 50); // Sky
    pointLight2.position.set(-10, -8, 8);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xa855f7, 2, 50); // Purple
    pointLight3.position.set(0, 8, -5);
    scene.add(pointLight3);

    // Group for all floating 3D objects
    const group = new THREE.Group();
    scene.add(group);

    // 1. Floating Product Card Meshes (Rounded boxes)
    const cardGeom = new THREE.BoxGeometry(2.4, 1.5, 0.15);
    const cardMaterials = [
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.25,
        metalness: 0.6,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.5,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.35,
        metalness: 0.4,
      }),
    ];

    const cards: THREE.Mesh[] = [];
    const cardPositions = [
      { x: 5.5, y: 2.2, z: 1.5, rot: 0.2 },
      { x: -5.8, y: 1.8, z: -0.5, rot: -0.25 },
      { x: 4.8, y: -2.8, z: 2.0, rot: -0.15 },
      { x: -4.5, y: -2.5, z: 0.5, rot: 0.3 },
    ];

    cardPositions.forEach((pos, idx) => {
      const card = new THREE.Mesh(cardGeom, cardMaterials[idx % cardMaterials.length]);
      card.position.set(pos.x, pos.y, pos.z);
      card.rotation.set(0.1, pos.rot, 0.05);
      cards.push(card);
      group.add(card);
    });

    // 2. Feedback / Discussion Spheres
    const bubbleGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });

    const bubbles: THREE.Mesh[] = [];
    const bubblePositions = [
      { x: 3.2, y: 3.5, z: 3 },
      { x: -3.5, y: 3.2, z: 2 },
      { x: 6.2, y: -0.5, z: 3.5 },
      { x: -5.2, y: -0.8, z: 2.5 },
      { x: 0.5, y: -3.8, z: 1.5 },
    ];

    bubblePositions.forEach((pos) => {
      const bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
      bubble.position.set(pos.x, pos.y, pos.z);
      bubbles.push(bubble);
      group.add(bubble);
    });

    // 3. Central AI Knowledge Octahedrons
    const octaGeom = new THREE.OctahedronGeometry(0.8, 0);
    const octaMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false,
    });
    const octahedron = new THREE.Mesh(octaGeom, octaMat);
    octahedron.position.set(0, 1.0, 0);
    group.add(octahedron);

    // 4. Connecting Network Particle Constellation
    const particleCount = 70;
    const particleGeom = new THREE.BufferGeometry();
    const particleCoords = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particleCoords[i] = (Math.random() - 0.5) * 22;
      particleCoords[i + 1] = (Math.random() - 0.5) * 12;
      particleCoords[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    group.add(particles);

    // 5. Connective Lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.25,
    });
    const linePoints: THREE.Vector3[] = [];
    cards.forEach((c) => {
      linePoints.push(c.position);
      linePoints.push(octahedron.position);
    });
    bubbles.forEach((b) => {
      linePoints.push(b.position);
      linePoints.push(octahedron.position);
    });
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    group.add(lines);

    // Mouse Interaction
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation (Parallax)
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      group.rotation.y = currentX + Math.sin(elapsedTime * 0.2) * 0.1;
      group.rotation.x = -currentY + Math.cos(elapsedTime * 0.25) * 0.06;

      // Pulse Central Octahedron
      octahedron.rotation.x = elapsedTime * 0.6;
      octahedron.rotation.y = elapsedTime * 0.8;
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.08;
      octahedron.scale.set(scale, scale, scale);

      // Float Cards
      cards.forEach((card, i) => {
        card.position.y += Math.sin(elapsedTime * 1.5 + i * 1.2) * 0.003;
        card.rotation.z += Math.cos(elapsedTime * 0.8 + i) * 0.001;
      });

      // Float Bubbles
      bubbles.forEach((b, i) => {
        b.position.y += Math.sin(elapsedTime * 2.0 + i) * 0.004;
      });

      // Slow particle rotation
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      cardGeom.dispose();
      bubbleGeom.dispose();
      octaGeom.dispose();
      particleGeom.dispose();
      lineGeom.dispose();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-center justify-center overflow-hidden border-b border-[var(--border-default)] bg-[var(--surface)]"
      aria-label="Welcome Hero"
    >
      {/* 3D WebGL Canvas Layer */}
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70 transition-opacity duration-700"
          aria-hidden="true"
        />
      ) : (
        /* CSS Mesh Fallback for non-WebGL / reduced motion */
        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.06),transparent_70%)]"
          aria-hidden="true"
        />
      )}

      {/* Subtle Atmospheric Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content (Clean typography, no keyword stuffing) */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Verification & Quality Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface)]/90 backdrop-blur-md shadow-xs mb-8 text-xs font-medium text-[var(--text-secondary)] animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Community Discussions</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="text-[var(--accent)] flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 inline" /> AI Intelligence
          </span>
          <span className="text-[var(--text-muted)]">•</span>
          <span>Android APKs</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6 max-w-4xl">
          Discover Products.{' '}
          <span className="text-[var(--accent)]">
            Share Ideas.
          </span>{' '}
          Shape Better Products.
        </h1>

        {/* Natural, clear, concise value proposition */}
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl font-normal leading-relaxed mb-10 text-balance">
          Discover applications, connect with their communities, share feedback, and help products improve.
        </p>

        {/* Primary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link to="/explore" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-7 py-3 text-base shadow-md hover:shadow-indigo-500/20 transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          <Link to="/publish" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-7 py-3 text-base border-[var(--border-default)] bg-[var(--surface)]/80 hover:bg-[var(--surface-hover)] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 text-[var(--accent)]" />
              <span>Publish Your Project</span>
            </Button>
          </Link>
        </div>

        {/* Real community signals */}
        <div className="mt-14 pt-8 border-t border-[var(--border-default)]/70 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 text-center text-xs text-[var(--text-muted)]">
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-500" />
            <span>Public Threaded Feedback</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Quarantined & Verified APKs</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Contextual AI Synthesis</span>
          </div>
        </div>
      </div>
    </section>
  );
};

