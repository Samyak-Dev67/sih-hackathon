import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { IndustryDashboard } from '../components/IndustryDashboard';
import { ProblemDetailModal } from '../components/ProblemDetailModal';
import { postService } from '../services/api';
import { supabase } from '../utils/supabase';
import '../index.css';

function IndustryPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'light');
  
  // Strictly null if not logged in (NO automatic demo account fallback!)
  const [account, setAccount] = useState(() => {
    const saved = localStorage.getItem('fl_active_account');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fl_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('fl_active_account');
    setAccount(null);
    window.location.href = '/';
  };

  useEffect(() => {
    // Only load posts if authorized
    if (account && account.role === 'industry') {
      async function load() {
        const data = await postService.getPosts();
        setPosts(data);
      }
      load();
    }
  }, [account]);

  const handleVote = async (postId, direction = 'up') => {
    if (!account) return;
    const updated = direction === 'down'
      ? await postService.downvotePost(postId, account.id)
      : await postService.likePost(postId, account.id);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
    }
  };

  const handleDownvote = (postId) => handleVote(postId, 'down');

  const handleSubmitSolution = async (postId, solData) => {
    const updated = await postService.submitSolution(postId, solData);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
    }
  };

  return (
    <div className="app-shell">
      <Navbar 
        currentUser={account}
        activePage="industry"
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => { window.location.href = '/?auth=login&role=industry'; }}
        onLogout={handleLogout}
      />
      <main className="app-main-viewport">
        <AuthGuard expectedRole="industry" currentAccount={account}>
          <IndustryDashboard 
            currentAccount={account}
            posts={posts}
            onVote={handleVote}
            onDownvote={handleDownvote}
            onSelectPost={(post) => setSelectedPost(post)}
          />
        </AuthGuard>
      </main>
      {account && account.role === 'industry' && (
        <ProblemDetailModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentAccount={account}
          onVote={handleVote}
          onDownvote={handleDownvote}
          onSubmitSolution={handleSubmitSolution}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IndustryPage />
  </React.StrictMode>
);
