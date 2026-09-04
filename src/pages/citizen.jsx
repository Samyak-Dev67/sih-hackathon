import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { CitizenDashboard } from '../components/CitizenDashboard';
import { ProblemDetailModal } from '../components/ProblemDetailModal';
import { postService } from '../services/api';
import { supabase } from '../utils/supabase';
import '../index.css';

function CitizenPage() {
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
    if (account && account.role === 'citizen') {
      async function load() {
        const data = await postService.getPosts();
        setPosts(data);
      }
      load();
    }
  }, [account]);

  const handleVote = async (postId) => {
    if (!account) return;
    const updated = await postService.likePost(postId, account.id);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
    }
  };

  const handleCreateProblem = async (problemData) => {
    const created = await postService.createPost(problemData);
    setPosts(prev => [created, ...prev]);
    setSelectedPost(created);
  };

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
        activePage="citizen"
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => { window.location.href = '/?auth=login&role=citizen'; }}
        onLogout={handleLogout}
      />
      <main className="app-main-viewport">
        <AuthGuard expectedRole="citizen" currentAccount={account}>
          <CitizenDashboard 
            currentAccount={account}
            posts={posts}
            onVote={handleVote}
            onSelectPost={(post) => setSelectedPost(post)}
            onSubmitProblem={handleCreateProblem}
          />
        </AuthGuard>
      </main>
      {account && account.role === 'citizen' && (
        <ProblemDetailModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentAccount={account}
          onVote={handleVote}
          onSubmitSolution={handleSubmitSolution}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CitizenPage />
  </React.StrictMode>
);
