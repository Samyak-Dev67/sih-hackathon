import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { IndustryDashboard } from '../components/IndustryDashboard';
import { ProblemDetailModal } from '../components/ProblemDetailModal';
import { ProblemWorkspace } from '../components/ProblemWorkspace';
import { postService } from '../services/api';
import { supabase } from '../utils/supabase';
import '../index.css';

function IndustryPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'dark');
  
  // Strictly null if not logged in
  const [account, setAccount] = useState(() => {
    const saved = localStorage.getItem('fl_active_account');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('search') || params.get('q') || '';
    } catch (e) {
      return '';
    }
  });

  const [activeWorkspacePostId, setActiveWorkspacePostId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('workspace') || null;
    } catch (e) {
      return null;
    }
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

  const handleFundChallenge = (postId) => {
    if (!account) return;
    postService.fundChallenge(postId, account);
    setActiveWorkspacePostId(postId);
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

  const handleSelectNewsProject = (postId) => {
    const matchingPost = posts.find(p => String(p.id) === String(postId));
    if (matchingPost) {
      setSelectedPost(matchingPost);
    } else {
      handleOpenWorkspace(postId);
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProject={handleSelectNewsProject}
      />
      <main className="app-main-viewport">
        <AuthGuard expectedRole="industry" currentAccount={account}>
          {activeWorkspacePostId ? (
            <ProblemWorkspace 
              postId={activeWorkspacePostId}
              post={activeWorkspacePost}
              currentAccount={account}
              onBack={handleCloseWorkspace}
              onFundChallenge={handleFundChallenge}
            />
          ) : (
            <IndustryDashboard 
              currentAccount={account}
              posts={posts}
              onVote={handleVote}
              onDownvote={handleDownvote}
              onSelectPost={(post) => setSelectedPost(post)}
              onToggleResolve={handleToggleResolve}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenWorkspace={handleOpenWorkspace}
            />
          )}
        </AuthGuard>
      </main>
      {account && account.role === 'industry' && !activeWorkspacePostId && (
        <ProblemDetailModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentAccount={account}
          onVote={handleVote}
          onDownvote={handleDownvote}
          onUpdateProblem={handleUpdateProblem}
          onDeleteProblem={handleDeleteProblem}
          onToggleResolve={handleToggleResolve}
          onFundChallenge={handleFundChallenge}
          onOpenWorkspace={handleOpenWorkspace}
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
