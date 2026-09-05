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
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'dark');
  
  // Strictly null if not logged in (NO automatic demo account fallback!)
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

  const handleVote = async (postId, direction = 'up') => {
    if (!account) return;
    try {
      const updated = direction === 'down'
        ? await postService.downvotePost(postId, account.id)
        : await postService.likePost(postId, account.id);
      if (updated) {
        setPosts(prev => prev.map(p => p.id === postId ? updated : p));
        if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
      }
      return updated;
    } catch (err) {
      console.error(`Failed to ${direction}vote problem #${postId}:`, err);
      alert(err.message || `Failed to ${direction}vote problem.`);
    }
  };

  const handleDownvote = (postId) => handleVote(postId, 'down');

  const handleCreateProblem = async (problemData) => {
    const dataWithAuthor = {
      ...problemData,
      author_id: account?.id,
      author_name: account?.name,
      author_email: account?.email
    };
    let created;
    if (problemData.imageFile) {
      created = await postService.uploadImageAndCreatePost(problemData.imageFile, dataWithAuthor);
    } else {
      created = await postService.createPost(dataWithAuthor);
    }
    if (created) {
      setPosts(prev => [created, ...prev]);
      setSelectedPost(created);
    }
  };

  const handleUpdateProblem = async (postId, updatedFields) => {
    let updated;
    if (updatedFields.imageFile) {
      updated = await postService.uploadImageAndUpdatePost(postId, updatedFields.imageFile, updatedFields);
    } else {
      updated = await postService.updatePost(postId, updatedFields);
    }
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated } : p));
      setSelectedPost(prev => (prev && prev.id === postId ? { ...prev, ...updated } : prev));
    }
    return updated;
  };

  const handleDeleteProblem = async (postId) => {
    await postService.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleToggleResolve = async (postId, newStatus) => {
    const updated = await postService.toggleProblemStatus(postId, newStatus, account);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated, status: updated.status } : p));
      setSelectedPost(prev => (prev && prev.id === postId ? { ...prev, ...updated, status: updated.status } : prev));
    }
    return updated;
  };

  const handleSubmitSolution = async (postId, solData) => {
    const updated = await postService.submitSolution(postId, solData);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated, solutions: updated.solutions, solution: updated.solutions } : p));
      if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
    }
  };

  const handleDeleteSolution = async (postId, solutionId) => {
    const updated = await postService.deleteSolution(postId, solutionId, account);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated, solutions: updated.solutions, solution: updated.solutions } : p));
      setSelectedPost(prev => (prev && prev.id === postId ? { ...prev, ...updated, solutions: updated.solutions, solution: updated.solutions } : prev));
    }
    return updated;
  };

  const handleAddComment = async (postId, commentData) => {
    const updated = await postService.addComment(postId, commentData, account);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated, comments: updated.comments } : p));
      setSelectedPost(prev => (prev && prev.id === postId ? { ...prev, ...updated, comments: updated.comments } : prev));
    }
    return updated;
  };

  const handleDeleteComment = async (postId, commentId) => {
    const updated = await postService.deleteComment(postId, commentId, account);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated, comments: updated.comments } : p));
      setSelectedPost(prev => (prev && prev.id === postId ? { ...prev, ...updated, comments: updated.comments } : prev));
    }
    return updated;
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="app-main-viewport">
        <AuthGuard expectedRole="citizen" currentAccount={account}>
          <CitizenDashboard 
            currentAccount={account}
            posts={posts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onVote={handleVote}
            onDownvote={handleDownvote}
            onSelectPost={(post) => setSelectedPost(post)}
            onSubmitProblem={handleCreateProblem}
            onUpdateProblem={handleUpdateProblem}
            onDeleteProblem={handleDeleteProblem}
            onToggleResolve={handleToggleResolve}
          />
        </AuthGuard>
      </main>
      {account && account.role === 'citizen' && (
        <ProblemDetailModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentAccount={account}
          onVote={handleVote}
          onDownvote={handleDownvote}
          onSubmitSolution={handleSubmitSolution}
          onDeleteSolution={handleDeleteSolution}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onUpdateProblem={handleUpdateProblem}
          onDeleteProblem={handleDeleteProblem}
          onToggleResolve={handleToggleResolve}
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
