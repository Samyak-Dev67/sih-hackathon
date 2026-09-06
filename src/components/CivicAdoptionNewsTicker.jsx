import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAcceptedChallenges } from '../services/api';

const DEFAULT_NEWS_STORIES = [
  {
    id: 'news-sample-1',
    postId: 'sample-p1',
    title: 'Smart Municipal Drainage & Flood Telemetry',
    category: 'Infrastructure',
    universityName: 'IIT Delhi Research Lab',
    universityId: 'uni-demo-1',
    acceptedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    progress: 35,
    sponsor: 'Tata Sustainability Labs'
  },
  {
    id: 'news-sample-2',
    postId: 'sample-p2',
    title: 'Groundwater Arsenic Rapid Electrochemical Detection',
    category: 'Water Quality',
    universityName: 'IISc Sustainable Tech Lab',
    universityId: 'uni-demo-2',
    acceptedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    progress: 60,
    sponsor: null
  },
  {
    id: 'news-sample-3',
    postId: 'sample-p3',
    title: 'Solar-Powered Cold Storage for Perishable Crops',
    category: 'Agriculture',
    universityName: 'IIT Bombay Innovation Hub',
    universityId: 'uni-demo-3',
    acceptedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    progress: 80,
    sponsor: 'Mahindra AgriTech'
  }
];

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recently';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return 'Recently';
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(then).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function CivicAdoptionNewsTicker({
  onSelectProject,
  currentUser = null
}) {
  const [realChallenges, setRealChallenges] = useState(() => getAcceptedChallenges());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const timerRef = useRef(null);

  // Sync with localStorage updates across tabs or within this window
  useEffect(() => {
    const handleSync = () => {
      setRealChallenges(getAcceptedChallenges());
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('fl_challenge_accepted', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fl_challenge_accepted', handleSync);
    };
  }, []);

  // Merge real claims with curated stories so ticker is never empty
  const stories = useMemo(() => {
    const realList = Array.isArray(realChallenges) ? realChallenges : [];
    const formattedReal = realList.map(c => ({
      id: c.id || `claim-${c.postId}`,
      postId: c.postId,
      title: c.title,
      category: c.category || 'Civic Tech',
      universityName: c.universityName || 'University Research Lab',
      universityId: c.universityId,
      acceptedAt: c.acceptedAt || new Date().toISOString(),
      progress: c.progress || 0,
      sponsor: c.fundedByIndustry?.name || null
    }));

    // Filter out defaults that might duplicate real postIds
    const realPostIds = new Set(formattedReal.map(r => String(r.postId)));
    const filteredDefaults = DEFAULT_NEWS_STORIES.filter(d => !realPostIds.has(String(d.postId)));

    const combined = [...formattedReal, ...filteredDefaults];
    // Sort descending by acceptedAt date
    return combined.sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime());
  }, [realChallenges]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= stories.length) {
      setCurrentIndex(0);
    }
  }, [stories.length, currentIndex]);

  // Automatic Rotation
  useEffect(() => {
    if (isPaused || isHovered || stories.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % stories.length);
    }, 5200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isHovered, stories.length]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % stories.length);
  };

  const activeStory = stories[currentIndex] || stories[0];

  const handleStoryClick = (story) => {
    if (!story) return;
    if (onSelectProject) {
      onSelectProject(story.postId, story);
    } else {
      // If on university dashboard or other pages with query param support
      const currentRole = currentUser?.role;
      if (currentRole === 'university') {
        window.location.href = `/university.html?workspace=${story.postId}`;
      } else if (currentRole === 'citizen') {
        window.location.href = `/citizen.html?search=${encodeURIComponent(story.title)}`;
      } else if (currentRole === 'industry') {
        window.location.href = `/industry.html?search=${encodeURIComponent(story.title)}`;
      } else {
        // Guest or landing
        window.location.href = `/?search=${encodeURIComponent(story.title)}`;
      }
    }
  };

  if (!activeStory) return null;

  // Filtered stories for All Adoptions Modal
  const modalStories = stories.filter(s => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.universityName && s.universityName.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div 
        className="civic-news-bar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Civic Research Adoptions News Ticker"
      >
        <div className="civic-news-inner">
          {/* Left Live Indicator Badge */}
          <div className="civic-news-badge-group">
            <span className="civic-pulse-dot" aria-hidden="true" />
            <span className="civic-news-kicker">LIVE CIVIC DISPATCH</span>
            <span className="civic-news-counter-pill">
              {stories.length} Adoptions
            </span>
          </div>

          <div className="civic-news-divider-vert" />

          {/* Center Story Content */}
          <div 
            className="civic-news-content-track"
            onClick={() => handleStoryClick(activeStory)}
            title="Click to view project details or workspace"
          >
            <div className="civic-news-story-item">
              <span className="civic-news-uni-tag">
                {activeStory.universityName}
              </span>
              <span className="civic-news-verb">
                accepted civic challenge:
              </span>
              <span className="civic-news-project-title">
                "{activeStory.title}"
              </span>
              <span className="tag-pill category-tag-xs civic-news-cat-pill">
                {activeStory.category}
              </span>
              {activeStory.sponsor && (
                <span className="civic-news-sponsor-pill">
                  Sponsored by {activeStory.sponsor}
                </span>
              )}
              <span className="civic-news-timestamp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatRelativeTime(activeStory.acceptedAt)}
              </span>
            </div>
          </div>

          {/* Right Navigation & Controls */}
          <div className="civic-news-controls">
            <button
              type="button"
              className="civic-news-ctrl-btn"
              onClick={handlePrev}
              title="Previous civic update"
              aria-label="Previous update"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="civic-news-index-indicator">
              {currentIndex + 1}/{stories.length}
            </span>

            <button
              type="button"
              className="civic-news-ctrl-btn"
              onClick={handleNext}
              title="Next civic update"
              aria-label="Next update"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              type="button"
              className={`civic-news-ctrl-btn ${isPaused ? 'is-active' : ''}`}
              onClick={() => setIsPaused(prev => !prev)}
              title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
            >
              {isPaused ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            <div className="civic-news-divider-vert" />

            <button
              type="button"
              className="civic-news-all-btn"
              onClick={() => setShowAllModal(true)}
              title="View all university problem claims in detail"
            >
              View All Adoptions
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL: ALL UNIVERSITY ADOPTIONS DIRECTORY                         */}
      {/* ================================================================= */}
      {showAllModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowAllModal(false)}>
          <div 
            className="civic-adoptions-modal-container" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adoptions-modal-title"
          >
            {/* Modal Header */}
            <div className="modal-header-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="civic-pulse-dot" />
                  <span className="civic-news-kicker">INSTITUTIONAL REGISTRY</span>
                </div>
                <h2 className="modal-heading-title" id="adoptions-modal-title">
                  All University Research Adoptions
                </h2>
                <p className="modal-subheading-text">
                  Chronological dispatch of public challenges accepted into university research workspaces.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowAllModal(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Filter Search Bar */}
            <div className="adoptions-search-bar">
              <input
                type="text"
                placeholder="Search by university name, problem title, or category..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="feed-search-input"
              />
              {filterQuery && (
                <button
                  type="button"
                  className="feed-search-clear-btn"
                  onClick={() => setFilterQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Adoptions Table / Cards */}
            <div className="adoptions-modal-scroll">
              {modalStories.length === 0 ? (
                <div className="empty-accepted-box">
                  <h3>No Adoptions Found</h3>
                  <p>No university project claims match "{filterQuery}".</p>
                </div>
              ) : (
                <div className="adoptions-table-responsive">
                  <table className="adoptions-table">
                    <thead>
                      <tr>
                        <th>Accepted Challenge</th>
                        <th>Lead Institution</th>
                        <th>Impact Domain</th>
                        <th>When Claimed</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalStories.map((story) => (
                        <tr key={story.id}>
                          <td>
                            <div className="adoption-title-cell">
                              <span className="adoption-title-text">{story.title}</span>
                              {story.sponsor && (
                                <span className="adoption-sponsor-badge">
                                  Partner: {story.sponsor}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="adoption-uni-cell">
                              <div className="adoption-uni-avatar">
                                {story.universityName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="adoption-uni-name">
                                {story.universityName}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="tag-pill category-tag-xs">
                              {story.category}
                            </span>
                          </td>
                          <td>
                            <div className="adoption-time-cell">
                              <span className="adoption-time-relative">
                                {formatRelativeTime(story.acceptedAt)}
                              </span>
                              <span className="adoption-time-exact">
                                {new Date(story.acceptedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="tag-pill status-accepted-badge" style={{ fontSize: '0.72rem' }}>
                              {story.progress ? `${story.progress}% Progress` : 'In Progress'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setShowAllModal(false);
                                handleStoryClick(story);
                              }}
                            >
                              View Project →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-row">
              <span className="adoptions-summary-count">
                Showing {modalStories.length} of {stories.length} Total Research Adoptions
              </span>
              <button
                type="button"
                className="btn btn-blue btn-sm"
                onClick={() => setShowAllModal(false)}
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default CivicAdoptionNewsTicker;
