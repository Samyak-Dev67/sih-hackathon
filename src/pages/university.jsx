import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { UniversityDashboard } from '../components/UniversityDashboard';
import { ProblemDetailModal } from '../components/ProblemDetailModal';
import { ProblemWorkspace } from '../components/ProblemWorkspace';
import { postService } from '../services/api';
import { supabase } from '../utils/supabase';
import '../index.css';

function UniversityPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'dark');
  
  // Strictly null if not logged in
  const [account, setAccount] = useState(() => {
    const saved = localStorage.getItem('fl_active_account');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('search') || p.get('q') || '';
  });

  // Dedicated workspace view state
  const [activeWorkspacePostId, setActiveWorkspacePostId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('workspace') || null;
  });

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
    if (account && account.role === 'university') {
      async function load() {
        const data = await postService.getPosts();
        setPosts(data);
      }
      load();
    }
  }, [account]);

  const handleVote = async (postId, direction = 'up') => {
    if (!account) return;
    try {
      const updated = direction === 'down'
        ? await postService.downvotePost(postId, account.id)
        : await postService.likePost(postId, account.id);
      if (updated) {
        setPosts(prev => prev.map(p => String(p.id) === String(postId) ? updated : p));
        if (selectedPost && String(selectedPost.id) === String(postId)) setSelectedPost(updated);
      }
      return updated;
    } catch (err) {
      console.error(`Failed to ${direction}vote problem #${postId}:`, err);
      alert(err.message || `Failed to ${direction}vote problem.`);
    }
  };

  const handleDownvote = (postId) => handleVote(postId, 'down');

  const handleToggleResolve = async (postId, newStatus) => {
    const updated = await postService.toggleProblemStatus(postId, newStatus, account);
    if (updated) {
      setPosts(prev => prev.map(p => String(p.id) === String(postId) ? { ...p, ...updated, status: updated.status } : p));
      setSelectedPost(prev => (prev && String(prev.id) === String(postId) ? { ...prev, ...updated, status: updated.status } : prev));
    }
    return updated;
  };

  const handleUpdateProblem = async (postId, updatedFields) => {
    let updated;
    if (updatedFields.imageFile) {
      updated = await postService.uploadImageAndUpdatePost(postId, updatedFields.imageFile, updatedFields);
    } else {
      updated = await postService.updatePost(postId, updatedFields);
    }
    if (updated) {
      setPosts(prev => prev.map(p => String(p.id) === String(postId) ? { ...p, ...updated } : p));
      setSelectedPost(prev => (prev && String(prev.id) === String(postId) ? { ...prev, ...updated } : prev));
    }
    return updated;
  };

  const handleDeleteProblem = async (postId) => {
    await postService.deletePost(postId);
    setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
    if (selectedPost && String(selectedPost.id) === String(postId)) {
      setSelectedPost(null);
    }
  };

  // University workspace claim handler
  const handleAcceptChallenge = (post) => {
    if (!account) return;
    postService.acceptChallenge(post, account);
    setActiveWorkspacePostId(post.id);
    setSelectedPost(null);
  };

  const handleOpenWorkspace = (postId) => {
    setActiveWorkspacePostId(postId);
    setSelectedPost(null);
  };

  const handleCloseWorkspace = () => {
    setActiveWorkspacePostId(null);
    const url = new URL(window.location);
    url.searchParams.delete('workspace');
    window.history.pushState({}, '', url);
  };

  const activeWorkspacePost = posts.find(p => String(p.id) === String(activeWorkspacePostId));

  return (
    <div className="app-shell">
      <Navbar 
        currentUser={account}
        activePage="university"
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => { window.location.href = '/?auth=login&role=university'; }}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="app-main-viewport">
        <AuthGuard expectedRole="university" currentAccount={account}>
          {activeWorkspacePostId ? (
            <ProblemWorkspace 
              postId={activeWorkspacePostId}
              post={activeWorkspacePost}
              currentAccount={account}
              onBack={handleCloseWorkspace}
            />
          ) : (
            <UniversityDashboard 
              currentAccount={account}
              posts={posts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onVote={handleVote}
              onDownvote={handleDownvote}
              onSelectPost={(post) => setSelectedPost(post)}
              onToggleResolve={handleToggleResolve}
              onOpenWorkspace={handleOpenWorkspace}
              onAcceptChallenge={handleAcceptChallenge}
            />
          )}
        </AuthGuard>
      </main>
      {account && account.role === 'university' && !activeWorkspacePostId && (
        <ProblemDetailModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentAccount={account}
          onVote={handleVote}
          onDownvote={handleDownvote}
          onUpdateProblem={handleUpdateProblem}
          onDeleteProblem={handleDeleteProblem}
          onToggleResolve={handleToggleResolve}
          onAcceptChallenge={handleAcceptChallenge}
          onOpenWorkspace={handleOpenWorkspace}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UniversityPage />
  </React.StrictMode>
);
