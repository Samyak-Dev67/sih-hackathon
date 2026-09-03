import React from 'react';
import { Home, Compass, Users2, CheckCircle2, Building, HeartPulse, GraduationCap, Leaf, Wheat, Zap, Cpu, HelpCircle } from 'lucide-react';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  selectedCategory, 
  setSelectedCategory 
}) {
  const categoriesWithIcons = [
    { name: "Infrastructure", icon: Building },
    { name: "Healthcare", icon: HeartPulse },
    { name: "Education", icon: GraduationCap },
    { name: "Climate", icon: Leaf },
    { name: "Agriculture", icon: Wheat },
    { name: "Energy", icon: Zap },
    { name: "Technology", icon: Cpu }
  ];

  return (
    <aside className="left-sidebar">
      {/* Primary Navigation */}
      <div className="sidebar-section primary-nav">
        <button 
          className={`sidebar-nav-item ${activeTab === 'home' && selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('home');
            setSelectedCategory('All');
          }}
        >
          <Home size={18} className="nav-icon" />
          <span>Home</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <Compass size={18} className="nav-icon" />
          <span>Discover</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users2 size={18} className="nav-icon" />
          <span>My Teams</span>
        </button>

        <button 
          className={`sidebar-nav-item ${activeTab === 'solutions' ? 'active' : ''}`}
          onClick={() => setActiveTab('solutions')}
        >
          <CheckCircle2 size={18} className="nav-icon" />
          <span>Solutions</span>
        </button>
      </div>

      <div className="sidebar-divider"></div>

      {/* Explore section */}
      <div className="sidebar-section explore-nav">
        <span className="sidebar-subheading">EXPLORE</span>
        <div className="explore-links-list">
          {categoriesWithIcons.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button 
                key={cat.name}
                className={`explore-category-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setActiveTab('home');
                }}
              >
                <span className="cat-name-text">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-footer">
        <a 
          href="#guidelines" 
          className="sidebar-footer-link" 
          onClick={(e) => { 
            e.preventDefault(); 
            alert("First Look Guidelines:\n1. Real-World Impact: All posted problems must address genuine municipal, environmental, or industrial challenges.\n2. Cross-Sector Synergy: Submissions encourage collaborative bids across citizens, universities, and industry.\n3. Verified Outcomes: Grants and pilot implementations are audited through milestone deliverables."); 
          }}
        >
          <HelpCircle size={15} />
          <span>Help & Guidelines</span>
        </a>
      </div>
    </aside>
  );
}
