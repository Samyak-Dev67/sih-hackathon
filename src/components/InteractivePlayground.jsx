import React, { useState, useEffect, useRef } from 'react';

// Pool of interesting real-world civic problems to spawn in the web
const PROBLEM_POOL = [
  { text: 'Grid Surges on Solar Lines', cat: 'Energy', icon: '⚡', color: '#f472b6' },
  { text: 'Bus Delays on Route 4', cat: 'Transit', icon: '🚌', color: '#c084fc' },
  { text: 'Nitrate Leaks in Wells', cat: 'Water', icon: '💧', color: '#38bdf8' },
  { text: 'Dark Streetlights on 5th Ave', cat: 'Safety', icon: '💡', color: '#fbbf24' },
  { text: 'Stormwater Basin Overflow', cat: 'Climate', icon: '🌧️', color: '#34d399' },
  { text: 'Plaza Heat Island', cat: 'Urban', icon: '🌡️', color: '#f87171' },
  { text: 'Suburban EV Charger Gap', cat: 'Mobility', icon: '🔌', color: '#a78bfa' },
  { text: 'School Zone Gridlock', cat: 'Safety', icon: '🚸', color: '#fb923c' },
  { text: 'Microplastics in Canal Runoff', cat: 'Ecology', icon: '🧪', color: '#2dd4bf' },
  { text: 'Hospital Rush-Hour Bottleneck', cat: 'Health', icon: '🏥', color: '#e879f9' },
  { text: 'E-Waste Hub Overflow', cat: 'Waste', icon: '♻️', color: '#4ade80' },
  { text: 'Highway Noise Pollution', cat: 'Civic', icon: '🔊', color: '#f43f5e' },
  { text: 'Runoff Soil Erosion', cat: 'Farming', icon: '🌱', color: '#a3e635' },
  { text: 'Water Main Pressure Drops', cat: 'Infra', icon: '🚰', color: '#60a5fa' }
];

export function InteractivePlayground() {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const poolIndexRef = useRef(0);

  // Nodes array: each node has id, text, cat, icon, color, x, y, vx, vy, baseSpeed, angle
  const [nodes, setNodes] = useState([]);
  const [activeNode, setActiveNode] = useState(null);

  // Initialize with 3 small connected seed nodes
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2 || 400;
      const cy = rect.height / 2 || 220;

      const seed0 = {
        id: 'node-0',
        ...PROBLEM_POOL[0],
        x: cx - 110,
        y: cy - 30,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        parentId: null,
        upvotes: 24,
        createdAt: Date.now()
      };

      const seed1 = {
        id: 'node-1',
        ...PROBLEM_POOL[1],
        x: cx + 40,
        y: cy + 40,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        parentId: 'node-0',
        upvotes: 38,
        createdAt: Date.now()
      };

      const seed2 = {
        id: 'node-2',
        ...PROBLEM_POOL[2],
        x: cx + 130,
        y: cy - 60,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        parentId: 'node-1',
        upvotes: 19,
        createdAt: Date.now()
      };

      poolIndexRef.current = 3;
      setNodes([seed0, seed1, seed2]);
      setActiveNode(seed0);
    }, 150);

    return () => clearTimeout(initTimer);
  }, []);

  // Truly random organic floating loop — NO spring pull, NO line elastic constraint
  useEffect(() => {
    const updateFloat = () => {
      setNodes((prevNodes) => {
        if (!containerRef.current || prevNodes.length === 0) return prevNodes;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const padding = 35;

        return prevNodes.map((node) => {
          // Add subtle random wander jitter so they drift naturally like dust motes / clouds
          let vx = node.vx + (Math.random() - 0.5) * 0.025;
          let vy = node.vy + (Math.random() - 0.5) * 0.025;

          // Clamp speed so motion remains graceful and floaty
          const maxSpeed = 0.55;
          const minSpeed = 0.18;
          const currentSpeed = Math.hypot(vx, vy);

          if (currentSpeed > maxSpeed) {
            vx = (vx / currentSpeed) * maxSpeed;
            vy = (vy / currentSpeed) * maxSpeed;
          } else if (currentSpeed < minSpeed && currentSpeed > 0.001) {
            vx = (vx / currentSpeed) * minSpeed;
            vy = (vy / currentSpeed) * minSpeed;
          }

          let nx = node.x + vx;
          let ny = node.y + vy;

          // Soft smooth reflection off boundary walls
          if (nx < padding) {
            nx = padding;
            vx = Math.abs(vx);
          } else if (nx > width - padding) {
            nx = width - padding;
            vx = -Math.abs(vx);
          }

          if (ny < padding) {
            ny = padding;
            vy = Math.abs(vy);
          } else if (ny > height - padding) {
            ny = height - padding;
            vy = -Math.abs(vy);
          }

          return {
            ...node,
            x: nx,
            y: ny,
            vx,
            vy
          };
        });
      });

      animFrameRef.current = requestAnimationFrame(updateFloat);
    };

    animFrameRef.current = requestAnimationFrame(updateFloat);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Handle clicking inside the sandbox area to spawn a connected problem bubble
  const handleStageClick = (e) => {
    // If clicking directly on top buttons, ignore
    if (e.target.closest('.interactive-bar-btn') || e.target.closest('.node-bubble-inner')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    spawnBubbleAt(clickX, clickY);
  };

  const spawnBubbleAt = (spawnX, spawnY) => {
    const nextProblem = PROBLEM_POOL[poolIndexRef.current % PROBLEM_POOL.length];
    poolIndexRef.current += 1;

    setNodes((prevNodes) => {
      // Connect to the closest node
      let closestParent = null;
      let minDistance = Infinity;

      if (prevNodes.length > 0) {
        prevNodes.forEach((node) => {
          const dist = Math.hypot(node.x - spawnX, node.y - spawnY);
          if (dist < minDistance) {
            minDistance = dist;
            closestParent = node;
          }
        });
      }

      // Random float trajectory in any direction
      const randomAngle = Math.random() * Math.PI * 2;
      const initialSpeed = 0.35 + Math.random() * 0.2;

      const newNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...nextProblem,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(randomAngle) * initialSpeed,
        vy: Math.sin(randomAngle) * initialSpeed,
        parentId: closestParent ? closestParent.id : null,
        upvotes: Math.floor(Math.random() * 25) + 6,
        createdAt: Date.now()
      };

      setActiveNode(newNode);
      return [...prevNodes, newNode];
    });
  };

  // Reset the web
  const handleReset = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2 || 400;
    const cy = rect.height / 2 || 220;

    const seed = {
      id: 'node-fresh-0',
      ...PROBLEM_POOL[0],
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      parentId: null,
      upvotes: 18,
      createdAt: Date.now()
    };

    poolIndexRef.current = 1;
    setNodes([seed]);
    setActiveNode(seed);
  };

  // Upvote bubble
  const handleUpvoteNode = (e, nodeId) => {
    e.stopPropagation();
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, upvotes: n.upvotes + 1 } : n))
    );
  };

  return (
    <section className="lp-web-section reveal">
      <div className="lp-web-container">
        {/* Section Header */}
        <div className="lp-web-header">
          <div className="lp-web-pill-row">
            <span className="lp-web-pill">
              <span className="live-pulsing-dot" /> PROBLEM NETWORK WEB
            </span>
            <span className="lp-web-hint">Click anywhere inside the box to weave new problems</span>
          </div>
          <h2 className="lp-web-title">The Living Civic Constellation</h2>
          <p className="lp-web-subtitle">
            Every issue is connected. Tap anywhere in the space below to spawn an interconnected problem bubble. Watch them link and float freely in real time.
          </p>
        </div>

        {/* The Interactive Floating Bubble Window */}
        <div className="web-window">
          {/* Top Bar - Cleaned: Red/Yellow/Green Mac dots removed */}
          <div className="web-window-bar">
            <div className="web-instruction-badge">
              <span className="web-tap-icon">✨</span>
              <span>Click anywhere inside to spawn & link problems</span>
            </div>
            <div className="web-stats-badge">
              <span className="web-nodes-count">{nodes.length} Connected Issues</span>
              <button type="button" onClick={handleReset} className="interactive-bar-btn" title="Reset Sandbox Web">
                Reset Web ↺
              </button>
            </div>
          </div>

          {/* Floating Bubble Stage */}
          <div 
            ref={containerRef}
            className="web-stage"
            onClick={handleStageClick}
          >
            {/* Ambient Background Grid & Radial Glow */}
            <div className="web-stage-grid" />
            <div className="web-ambient-glow" />

            {/* SVG Connecting Web Lines */}
            <svg className="web-lines-svg">
              <defs>
                <linearGradient id="webLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {nodes.map((node) => {
                if (!node.parentId) return null;
                const parent = nodes.find((n) => n.id === node.parentId);
                if (!parent) return null;

                return (
                  <g key={`line-${node.id}-${parent.id}`}>
                    <line
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke="url(#webLineGrad)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="pulsing-web-line"
                    />
                    <circle
                      cx={(parent.x + node.x) / 2}
                      cy={(parent.y + node.y) / 2}
                      r="2"
                      fill="#c084fc"
                      className="web-signal-pulse"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Bubble Nodes (Compact Size) */}
            {nodes.map((node) => {
              const isFocused = activeNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  className={`node-bubble ${isFocused ? 'is-focused' : ''}`}
                  style={{
                    transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                    '--bubble-color': node.color
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNode(node);
                    handleUpvoteNode(e, node.id);
                  }}
                >
                  <div className="node-bubble-inner">
                    <div className="bubble-cat-tag">
                      <span className="bubble-icon">{node.icon}</span>
                      <span className="bubble-cat-name">{node.cat}</span>
                    </div>
                    <div className="bubble-problem-text">{node.text}</div>
                    <div className="bubble-footer-row">
                      <span className="bubble-upvote-chip" title="Click to boost">
                        ⚡ {node.upvotes}
                      </span>
                      <span className="bubble-linked-dot" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Helper Floating Overlay Tag */}
            <div className="web-helper-chip">
              <span>👉 Click anywhere to expand the floating web</span>
            </div>

            {/* Selected Node Inspector Peek (Bottom Edge) */}
            {activeNode && (
              <div className="web-inspector-card" onClick={(e) => e.stopPropagation()}>
                <div className="inspector-top-row">
                  <div className="inspector-tag-group">
                    <span className="inspector-icon">{activeNode.icon}</span>
                    <span className="inspector-cat">{activeNode.cat} Sector</span>
                  </div>
                  <span className="inspector-upvote-badge">⚡ {activeNode.upvotes} Citizens Impacted</span>
                </div>
                <div className="inspector-title">{activeNode.text}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
