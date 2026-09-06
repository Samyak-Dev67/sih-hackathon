import { INITIAL_POSTS, INITIAL_ACCEPTED_CHALLENGES } from '../data/mockData.js';
import { supabase } from '../utils/supabase.js';
import { filterProblems } from '../utils/search.js';

/**
 * ==============================================================================
 * DATABASE SCHEMA REFERENCE: `posts`
 * ==============================================================================
 * - id: int8 (Primary Key)
 * - created_at: timestamptz (Timestamp with time zone)
 * - title: varchar (Problem title)
 * - desc: varchar (Problem description)
 * - img: varchar (URL / Path to problem image)
 * - category: varchar (Domain category, e.g. Infrastructure, Health, Tech)
 * - score: numeric (Cumulative vote score / likes)
 * - comments: json (Reserved JSON field for discussions)
 * - solutions: json (Array of submitted solutions by universities & industries)
 * ==============================================================================
 */

// ==============================================================================
// BACKEND API BASE URL PLACEHOLDER
// Configure VITE_BACKEND_URL in your .env file, or replace this string placeholder.
// The frontend developer does NOT invent real endpoints. This is a clean placeholder
// structured for the backend developer to easily plug in their API server.
// ==============================================================================
export const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
// Examples:
// 'http://localhost:5000/api'
// 'https://api.yourdomain.com/v1'

/**
 * API ENDPOINT ROUTES
 * Centralized mapping of all backend endpoints for the `posts` table and solutions.
 * The backend developer can modify route patterns here without touching UI components.
 */
export const API_ENDPOINTS = {
  fetchProblems: '/posts',
  createProblem: '/posts',
  likeProblem: (id) => `/posts/${id}/like`,
  submitSolution: (id) => `/posts/${id}/solutions`,
  fetchSolutions: (id) => `/posts/${id}/solutions`,
};

// Local storage key for fallback simulation (keeps the 2 Lorem Ipsum questions alive)
const STORAGE_KEY = 'first_look_posts_db';

function getLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_POSTS;
  }
}

function saveLocalDB(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local store:', e);
  }
}

/**
 * Standardized HTTP request wrapper for backend JSON communication.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BACKEND_API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Attach active session token if present
  try {
    const saved = localStorage.getItem('fl_active_account');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {}

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 1. Fetch All Posts from Supabase
 * Fetch all posts ordered by creation date.
 * Throws error if Supabase request fails (no silent localStorage fallback).
 */
export async function getPosts() {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log('📡 [Supabase SELECT]: Fetching posts from "posts" table...');
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [Supabase SELECT Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security policy blocked SELECT on "posts" table. Please configure an RLS SELECT policy in Supabase.');
    }
    throw new Error(`Supabase SELECT failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase SELECT Success]: Retrieved ${data ? data.length : 0} posts from Supabase.`);
  const formatted = (data || []).map(post => {
    const postSols = Array.isArray(post.solutions)
      ? post.solutions
      : Array.isArray(post.solution)
        ? post.solution
        : [];
    const isResolved = post.resolved === true;

    // Extract metadata from comments JSON if present
    const meta = Array.isArray(post.comments)
      ? post.comments.find(c => c && typeof c === 'object' && c.__meta)
      : null;

    const likedBy = Array.isArray(post.liked_by)
      ? post.liked_by
      : (Array.isArray(meta?.liked_by) ? meta.liked_by : []);

    const downvotedBy = Array.isArray(post.downvoted_by)
      ? post.downvoted_by
      : (Array.isArray(meta?.downvoted_by) ? meta.downvoted_by : []);

    return {
      ...post,
      score: Number(post.score) || 0,
      solutions: postSols,
      solution: postSols,
      resolved: isResolved,
      status: isResolved ? 'Resolved' : 'Open',
      liked_by: likedBy,
      downvoted_by: downvotedBy
    };
  });
  return formatted;
}

/**
 * Fetch a single post by ID from Supabase
 */
export async function getPostById(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase SELECT]: Fetching post #${postId}...`);
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('❌ [Supabase SELECT Error (getPostById)]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Supabase getPostById failed: ${error.message} (code: ${error.code})`);
  }

  if (!data) return null;

  const postSols = Array.isArray(data.solutions)
    ? data.solutions
    : Array.isArray(data.solution)
      ? data.solution
      : [];
  const isResolved = data.resolved === true;

  const meta = Array.isArray(data.comments)
    ? data.comments.find(c => c && typeof c === 'object' && c.__meta)
    : null;

  const likedBy = Array.isArray(data.liked_by)
    ? data.liked_by
    : (Array.isArray(meta?.liked_by) ? meta.liked_by : []);

  const downvotedBy = Array.isArray(data.downvoted_by)
    ? data.downvoted_by
    : (Array.isArray(meta?.downvoted_by) ? meta.downvoted_by : []);

  return {
    ...data,
    score: Number(data.score) || 0,
    solutions: postSols,
    solution: postSols,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open',
    liked_by: likedBy,
    downvoted_by: downvotedBy
  };
}

export const getProblems = getPosts;

/**
 * Helper to check if a string is a valid UUID
 */
function isValidUUID(str) {
  return (
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  );
}

/**
 * Check if the currently authenticated or active account is the author of a post.
 */
export function isPostAuthor(post, currentAccount) {
  if (!post || !currentAccount) return false;

  // 1. Direct user_id match (Supabase auth UUID)
  if (post.user_id && currentAccount.id && post.user_id === currentAccount.id) {
    return true;
  }

  // 2. Direct author_id match
  if (post.author_id && currentAccount.id && post.author_id === currentAccount.id) {
    return true;
  }

  // 3. Metadata embedded inside comments JSON
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta) {
      if (meta.author_id && currentAccount.id && meta.author_id === currentAccount.id) return true;
      if (meta.author_email && currentAccount.email && meta.author_email === currentAccount.email) return true;
    }
  }

  // 4. Direct email match
  if (post.author_email && currentAccount.email && post.author_email === currentAccount.email) {
    return true;
  }

  return false;
}

/**
 * Check if the currently authenticated or active account is the author of a solution.
 */
export function isSolutionAuthor(solution, currentAccount) {
  if (!solution || !currentAccount) return false;

  // 1. Direct author_id match (UUID or demo ID)
  if (solution.author_id && currentAccount.id && solution.author_id === currentAccount.id) {
    return true;
  }

  // 2. Direct author_email match
  if (solution.author_email && currentAccount.email && solution.author_email.toLowerCase() === currentAccount.email.toLowerCase()) {
    return true;
  }

  // 3. Match author_name with active user name
  if (solution.author_name && currentAccount.name && solution.author_name.trim().toLowerCase() === currentAccount.name.trim().toLowerCase()) {
    return true;
  }

  // 4. Match author_name with active user email prefix
  if (solution.author_name && currentAccount.email && solution.author_name.trim().toLowerCase() === currentAccount.email.split('@')[0].trim().toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Check if the currently authenticated or active account is the author of a comment.
 */
export function isCommentAuthor(comment, currentAccount) {
  if (!comment || !currentAccount) return false;

  // 1. Direct author_id match
  if (comment.author_id && currentAccount.id && comment.author_id === currentAccount.id) {
    return true;
  }

  // 2. Direct author_email match
  if (comment.author_email && currentAccount.email && comment.author_email.toLowerCase() === currentAccount.email.toLowerCase()) {
    return true;
  }

  // 3. Match author_name with active user name
  if (comment.author_name && currentAccount.name && comment.author_name.trim().toLowerCase() === currentAccount.name.trim().toLowerCase()) {
    return true;
  }

  // 4. Match author_name with email prefix
  if (comment.author_name && currentAccount.email && comment.author_name.trim().toLowerCase() === currentAccount.email.split('@')[0].trim().toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Format timestamp into human-readable relative time (e.g., "12s ago", "5m ago", "2h ago", "3d ago").
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const timeMs = new Date(dateStr).getTime();
    if (isNaN(timeMs)) return 'Recently';

    const diffMs = Date.now() - timeMs;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks}w ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Helper to get status of a post ('Resolved' or 'Open')
 * Evaluates the `resolved` boolean column from Supabase directly.
 */
export function getPostStatus(post) {
  if (!post) return 'Open';
  // 1. Direct boolean column in Supabase
  if (post.resolved === true) return 'Resolved';
  if (post.resolved === false) return 'Open';
  // 2. Direct string status field if present
  if (post.status === 'Resolved' || post.status === 'Open') return post.status;
  // 3. Fallback check for comments __meta
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta?.status === 'Resolved') return 'Resolved';
  }
  return 'Open';
}

/**
 * Extract author display information from a post
 * Uses actual username from currentAccount, comments metadata, or Supabase user
 */
export function getPostAuthorInfo(post, currentAccount) {
  if (!post) return { name: 'Community Member', initials: 'CM' };

  // 1. If currently viewing user is the author, their actual account name takes precedence!
  const isAuthor = isPostAuthor(post, currentAccount);
  if (isAuthor && currentAccount) {
    const activeName = currentAccount.name || (currentAccount.email ? currentAccount.email.split('@')[0] : null);
    if (activeName && !activeName.toLowerCase().startsWith('citizen account')) {
      const initials = activeName
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return { name: activeName, initials: initials || activeName.substring(0, 2).toUpperCase() };
    }
  }

  // 2. Check comments metadata JSON
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta?.author_name && !meta.author_name.toLowerCase().startsWith('citizen account')) {
      const initials = meta.author_name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return { name: meta.author_name, initials: initials || meta.author_name.substring(0, 2).toUpperCase() };
    }
    if (meta?.author_email) {
      const username = meta.author_email.split('@')[0];
      const initials = username.substring(0, 2).toUpperCase();
      return { name: username, initials };
    }
  }

  // 3. Direct author_name if available on post object
  if (post.author_name && !post.author_name.toLowerCase().startsWith('citizen account')) {
    const initials = post.author_name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    return { name: post.author_name, initials: initials || post.author_name.substring(0, 2).toUpperCase() };
  }

  // 4. If post has user_id, check against currentAccount or create a clean handle
  if (post.user_id) {
    if (currentAccount && currentAccount.id === post.user_id) {
      const activeName = currentAccount.name || (currentAccount.email ? currentAccount.email.split('@')[0] : 'Citizen');
      const initials = activeName.substring(0, 2).toUpperCase();
      return { name: activeName, initials };
    }
    const shortId = post.user_id.substring(0, 5);
    return { name: `user_${shortId}`, initials: `U${shortId[0].toUpperCase()}` };
  }

  return { name: 'Community Member', initials: 'CM' };
}

/**
 * 2. Create a Problem / Post in Supabase
 * Inserts directly into Supabase `posts` table.
 * Records author identity via `user_id` and comments JSON metadata.
 * Throws actual Supabase error on failure (no silent localStorage fallback).
 */
export async function createPost(postData = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Determine active author info
  let authorId = postData?.author_id;
  let authorName = postData?.author_name;
  let authorEmail = postData?.author_email;

  if (!authorId || !authorName) {
    try {
      const saved = localStorage.getItem('fl_active_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!authorId && parsed.id) authorId = parsed.id;
        if (!authorName && parsed.name) authorName = parsed.name;
        if (!authorEmail && parsed.email) authorEmail = parsed.email;
      }
    } catch (e) {}
  }

  // Safe metadata inside comments JSON column (safe for DB schema)
  const metaObj = {
    __meta: true,
    author_id: authorId || null,
    author_name: authorName || (authorEmail ? authorEmail.split('@')[0] : 'Community Member'),
    author_email: authorEmail || null,
    created_at: new Date().toISOString(),
    liked_by: [],
    downvoted_by: []
  };

  const existingComments = Array.isArray(postData?.comments) ? postData.comments : [];
  const commentsPayload = [metaObj, ...existingComments];

  const payload = {
    title: postData?.title ? postData.title.trim() : 'How to optimize database queries',
    desc: postData?.desc ? postData.desc.trim() : 'A complete guide on indexing and schema design.',
    img: postData?.img ? postData.img.trim() : '',
    category: postData?.category ? postData.category.trim() : 'Infrastructure',
    score: typeof postData?.score === 'number' ? postData.score : 0,
    comments: commentsPayload,
    solutions: Array.isArray(postData?.solutions) ? postData.solutions : [],
    resolved: false
  };

  // If authorId is a valid UUID, include user_id
  if (authorId && isValidUUID(authorId)) {
    payload.user_id = authorId;
  }

  console.log('📡 [Supabase INSERT]: Attempting to insert into "posts" table:', payload);

  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select();

  if (error) {
    console.error('❌ [Supabase INSERT Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked INSERT into "posts" table (code 42501).');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and add an INSERT policy allowing authenticated users.');
    }
    throw new Error(`Supabase INSERT failed: ${error.message} (code: ${error.code})`);
  }

  if (!data || data.length === 0) {
    const err = new Error('Supabase INSERT returned no rows. Check if an RLS SELECT policy is preventing reading the inserted row.');
    console.warn('⚠️ [Supabase Warning]:', err.message);
    throw err;
  }

  console.log('✅ [Supabase INSERT Success]: Row successfully written to "posts" table:', data[0]);
  return data[0];
}

export const createProblem = createPost;

/**
 * 2b. Update an existing Post in Supabase (Author Only)
 * Only updates valid columns in `posts` table: title, desc, category, img, resolved, solutions.
 */
export async function updatePost(postId, updatedFields = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Updating post #${postId}...`, updatedFields);

  const targetId = !isNaN(Number(postId)) ? Number(postId) : postId;

  // Extract only columns that exist on `posts` table
  const payload = {};
  if (typeof updatedFields.title === 'string') payload.title = updatedFields.title.trim();
  if (typeof updatedFields.desc === 'string') payload.desc = updatedFields.desc.trim();
  if (typeof updatedFields.category === 'string') payload.category = updatedFields.category.trim();
  if (typeof updatedFields.img === 'string') payload.img = updatedFields.img.trim();
  if (typeof updatedFields.score === 'number') payload.score = updatedFields.score;
  if (typeof updatedFields.resolved === 'boolean') payload.resolved = updatedFields.resolved;
  if (Array.isArray(updatedFields.comments)) payload.comments = updatedFields.comments;
  if (Array.isArray(updatedFields.solutions)) payload.solutions = updatedFields.solutions;
  else if (Array.isArray(updatedFields.solution)) payload.solutions = updatedFields.solution;
  if (Array.isArray(updatedFields.liked_by)) payload.liked_by = updatedFields.liked_by;
  if (Array.isArray(updatedFields.downvoted_by)) payload.downvoted_by = updatedFields.downvoted_by;

  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', targetId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501). Check RLS UPDATE policy in Supabase.');
    }
    throw new Error(`Supabase UPDATE failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} updated successfully:`, data && data[0]);
  return data && data.length > 0 ? data[0] : { id: postId, ...payload };
}

export const updateProblem = updatePost;

/**
 * 2c. Delete a Post in Supabase (Author Only)
 * Permanently removes row from `posts` table.
 */
export async function deletePost(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase DELETE]: Deleting post #${postId}...`);

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase DELETE Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked DELETE on "posts" table (code 42501). Check RLS DELETE policy in Supabase.');
    }
    throw new Error(`Supabase DELETE failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase DELETE Success]: Post #${postId} removed from Supabase.`);
  return { success: true, id: postId, data };
}

export const deleteProblem = deletePost;

/**
 * Upload Image to Supabase Storage ('post-images') and Create Post
 */
export async function uploadImageAndCreatePost(file, postData = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  let imageUrl = postData.img || '';

  if (file) {
    console.log('📡 [Supabase Storage]: Uploading file to bucket "post-images"...', file.name);
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ [Supabase Storage Error]: Failed to upload to "post-images" bucket:', {
        message: uploadError.message
      });
      console.error('👉 Ensure bucket "post-images" exists in Supabase Storage and has public upload policies.');
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      imageUrl = urlData.publicUrl;
      console.log('✅ [Supabase Storage Success]: Public image URL generated:', imageUrl);
    }
  }

  return await createPost({
    ...postData,
    img: imageUrl
  });
}

/**
 * Upload Image to Supabase Storage ('post-images') and Update Existing Post
 */
export async function uploadImageAndUpdatePost(postId, file, updatedFields = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  let imageUrl = updatedFields.img || '';

  if (file) {
    console.log(`📡 [Supabase Storage]: Uploading new image for post #${postId}...`, file.name);
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ [Supabase Storage Error]: Failed to upload image:', uploadError.message);
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      imageUrl = urlData.publicUrl;
      console.log('✅ [Supabase Storage Success]: Public image URL generated:', imageUrl);
    }
  }

  return await updatePost(postId, {
    ...updatedFields,
    img: imageUrl
  });
}

/**
 * Add a Comment to a Post in Supabase (Citizen Only)
 */
export async function addComment(postId, commentData, currentAccount) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Validate citizen role
  const role = currentAccount?.role || commentData?.author_role;
  if (role && role !== 'citizen') {
    throw new Error('Only citizen accounts are authorized to post comments.');
  }

  const commentText = typeof commentData === 'string' ? commentData : commentData?.text || commentData?.comment;
  if (!commentText || !commentText.trim()) {
    throw new Error('Comment text cannot be empty.');
  }

  const authorDisplayName = currentAccount?.name || (currentAccount?.email ? currentAccount.email.split('@')[0] : commentData?.author_name || 'Citizen Member');

  const commentPayload = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    author_id: currentAccount?.id || commentData?.author_id || null,
    author_email: currentAccount?.email || commentData?.author_email || null,
    author_name: authorDisplayName,
    author_role: 'citizen',
    text: commentText.trim(),
    created_at: new Date().toISOString()
  };

  console.log(`📡 [Supabase UPDATE]: Adding citizen comment to post #${postId}...`, commentPayload);

  // 1. Fetch current post
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchError) {
    console.error('❌ [Supabase SELECT Error (addComment)]:', fetchError);
    throw new Error(`Failed to fetch post #${postId}: ${fetchError.message}`);
  }

  const existingComments = Array.isArray(post.comments) ? post.comments : [];
  const updatedComments = [...existingComments, commentPayload];

  // 2. Update comments in Supabase
  const { data, error } = await supabase
    .from('posts')
    .update({ comments: updatedComments })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (addComment)]:', error);
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts.comments".');
    }
    throw new Error(`Supabase failed to add comment: ${error.message} (code: ${error.code})`);
  }

  const updatedRecord = data && data.length > 0 ? data[0] : { ...post, comments: updatedComments };
  console.log(`✅ [Supabase UPDATE Success]: Comment added to post #${postId}:`, updatedRecord);
  return updatedRecord;
}

/**
 * Delete a Comment from a Post in Supabase (Comment Author Only)
 */
export async function deleteComment(postId, commentId, currentAccount) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Deleting comment #${commentId} from post #${postId}...`);

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch post #${postId}: ${fetchError.message}`);
  }

  const existingComments = Array.isArray(post.comments) ? post.comments : [];
  const targetComment = existingComments.find(c => c && c.id === commentId);

  if (!targetComment) {
    console.warn(`⚠️ Comment #${commentId} not found in post #${postId}`);
    return post;
  }

  if (currentAccount && !isCommentAuthor(targetComment, currentAccount)) {
    throw new Error('Unauthorized: You can only delete comments that you posted.');
  }

  const updatedComments = existingComments.filter(c => c && c.id !== commentId);

  const { data, error } = await supabase
    .from('posts')
    .update({ comments: updatedComments })
    .eq('id', postId)
    .select();

  if (error) {
    throw new Error(`Supabase failed to delete comment: ${error.message}`);
  }

  return data && data.length > 0 ? data[0] : { ...post, comments: updatedComments };
}

/**
 * Core unified voting handler
 * Enforces:
 * - 1 vote per account (upvote OR downvote)
 * - If user clicks the same vote arrow again, it toggles off / removes their vote.
 * - If user clicks the opposite vote arrow, it switches their vote (-2 or +2).
 * - Persists updated score directly to Supabase `score` column in the backend database.
 * - Supports tables with direct `liked_by`/`downvoted_by` columns as well as `comments` JSON metadata.
 * - Multi-tier fallback handling if table schema varies or RLS policies apply.
 */
export async function voteProblem(postId, accountId = 'default-account', direction = 'up') {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Normalize target ID for database matching (handle number or string IDs)
  const targetId = !isNaN(Number(postId)) ? Number(postId) : postId;

  // Derive voter ID
  let voterId = accountId;
  if (!voterId || voterId === 'default-account') {
    try {
      const saved = localStorage.getItem('fl_active_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        voterId = parsed.id || parsed.email || parsed.name;
      }
    } catch (e) {}
  }
  if (!voterId) {
    voterId = 'anonymous-user';
  }

  console.log(`📡 [Supabase UPDATE]: Processing ${direction}vote on post #${targetId} for user "${voterId}"...`);

  // 1. Fetch current post from Supabase
  let { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  // If not found with targetId and targetId differs from postId, retry with original postId
  if (!post && targetId !== postId) {
    const retry = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (retry.data) {
      post = retry.data;
      fetchError = null;
    }
  }

  if (fetchError) {
    console.error(`❌ [Supabase SELECT Error (voteProblem ${direction})]:`, fetchError);
    throw new Error(`Supabase failed to read post for vote: ${fetchError.message}`);
  }

  if (!post) {
    console.error(`❌ Post #${postId} not found in Supabase "posts" table.`);
    throw new Error(`Post #${postId} was not found in the backend database.`);
  }

  const exactDbId = post.id !== undefined ? post.id : targetId;
  let currentScore = Number(post.score);
  if (isNaN(currentScore)) {
    currentScore = Number(post.likes);
    if (isNaN(currentScore)) currentScore = 0;
  }

  // Extract comments and __meta
  const existingComments = Array.isArray(post.comments) ? [...post.comments] : [];
  let metaIdx = existingComments.findIndex(c => c && typeof c === 'object' && c.__meta);
  let meta = metaIdx >= 0 ? { ...existingComments[metaIdx] } : { __meta: true };

  // Current liked_by and downvoted_by arrays
  let likedBy = Array.isArray(post.liked_by)
    ? [...post.liked_by]
    : (Array.isArray(meta.liked_by) ? [...meta.liked_by] : []);

  let downvotedBy = Array.isArray(post.downvoted_by)
    ? [...post.downvoted_by]
    : (Array.isArray(meta.downvoted_by) ? [...meta.downvoted_by] : []);

  const hasLiked = likedBy.includes(voterId);
  const hasDownvoted = downvotedBy.includes(voterId);

  let newScore = currentScore;
  let scoreDelta = 0;

  if (direction === 'up') {
    if (hasLiked) {
      // Toggle off: remove upvote
      console.log(`ℹ️ [Vote]: User ${voterId} already upvoted post #${exactDbId}. Toggling off upvote.`);
      likedBy = likedBy.filter(id => id !== voterId);
      newScore = currentScore - 1;
      scoreDelta = -1;
    } else if (hasDownvoted) {
      // Switch from downvote to upvote (+2 net)
      console.log(`ℹ️ [Vote]: User ${voterId} switching from downvote to upvote on post #${exactDbId}.`);
      downvotedBy = downvotedBy.filter(id => id !== voterId);
      likedBy.push(voterId);
      newScore = currentScore + 2;
      scoreDelta = 2;
    } else {
      // First-time upvote (+1)
      console.log(`ℹ️ [Vote]: User ${voterId} upvoting post #${exactDbId}.`);
      likedBy.push(voterId);
      newScore = currentScore + 1;
      scoreDelta = 1;
    }
  } else if (direction === 'down') {
    if (hasDownvoted) {
      // Toggle off: remove downvote
      console.log(`ℹ️ [Vote]: User ${voterId} already downvoted post #${exactDbId}. Toggling off downvote.`);
      downvotedBy = downvotedBy.filter(id => id !== voterId);
      newScore = currentScore + 1;
      scoreDelta = 1;
    } else if (hasLiked) {
      // Switch from upvote to downvote (-2 net)
      console.log(`ℹ️ [Vote]: User ${voterId} switching from upvote to downvote on post #${exactDbId}.`);
      likedBy = likedBy.filter(id => id !== voterId);
      downvotedBy.push(voterId);
      newScore = currentScore - 2;
      scoreDelta = -2;
    } else {
      // First-time downvote (-1)
      console.log(`ℹ️ [Vote]: User ${voterId} downvoting post #${exactDbId}.`);
      downvotedBy.push(voterId);
      newScore = currentScore - 1;
      scoreDelta = -1;
    }
  }

  // Update __meta with the updated voter arrays
  meta.liked_by = likedBy;
  meta.downvoted_by = downvotedBy;
  if (metaIdx >= 0) {
    existingComments[metaIdx] = meta;
  } else {
    existingComments.unshift(meta);
  }

  // 2. Persist updated score to Supabase backend database
  let updatedRow = null;

  // Attempt 1: Try stored RPC function if configured in database (bypasses RLS with SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('vote_post', {
      p_post_id: exactDbId,
      p_score: newScore,
      p_voter_id: voterId,
      p_direction: direction
    });
    if (!rpcError && rpcData) {
      console.log(`✅ [Supabase RPC Success]: vote_post executed for #${exactDbId}`);
      updatedRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    }
  } catch (_) {}

  // Attempt 2: Direct UPDATE on the posts table
  if (!updatedRow) {
    const payload = {
      score: newScore
    };

    // Include comments metadata if comments column exists
    if ('comments' in post || Array.isArray(post.comments)) {
      payload.comments = existingComments;
    }

    // If table has direct liked_by / downvoted_by columns, update them too
    if ('liked_by' in post) {
      payload.liked_by = likedBy;
    }
    if ('downvoted_by' in post) {
      payload.downvoted_by = downvotedBy;
    }

    console.log(`📡 [Supabase UPDATE]: Updating post #${exactDbId} score in backend database:`, payload);

    let res = await supabase
      .from('posts')
      .update(payload)
      .eq('id', exactDbId)
      .select();

    // Fallback A: If update failed due to extra column (PGRST204), try with { score, comments }
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('column'))) {
      console.warn('⚠️ Column mismatch on vote update, retrying with { score, comments }...');
      res = await supabase
        .from('posts')
        .update({ score: newScore, comments: existingComments })
        .eq('id', exactDbId)
        .select();
    }

    // Fallback B: If comments failed or schema only has score, try { score } only
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('column'))) {
      console.warn('⚠️ Retrying vote update with { score } only...');
      res = await supabase
        .from('posts')
        .update({ score: newScore })
        .eq('id', exactDbId)
        .select();
    }

    // Fallback C: If column is named likes
    if (res.error && res.error.message?.includes('score')) {
      console.warn('⚠️ Retrying vote update with { likes } column...');
      res = await supabase
        .from('posts')
        .update({ likes: newScore })
        .eq('id', exactDbId)
        .select();
    }

    // Check for explicit RLS error
    if (res.error && res.error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501).');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and add an UPDATE policy on "posts".');
      throw new Error(`Supabase RLS policy blocked updating score: ${res.error.message}. Please enable UPDATE policy for the "posts" table in Supabase.`);
    }

    if (res.error) {
      console.error(`❌ [Supabase UPDATE Error (voteProblem)]`, res.error);
      throw new Error(`Supabase vote failed: ${res.error.message}`);
    }

    // Check if 0 rows were updated (silent RLS block where USING clause filters out the row)
    if (!res.data || res.data.length === 0) {
      console.warn(`⚠️ [Supabase RLS Blocked]: UPDATE returned 0 rows for post #${exactDbId}.`);
      console.warn(`👉 Row-Level Security on the "posts" table prevented non-authors or anon users from updating the score.`);
      console.warn(`👉 To fix in Supabase SQL Editor:`);
      console.warn(`   CREATE POLICY "Allow public update on posts" ON "public"."posts" FOR UPDATE USING (true) WITH CHECK (true);`);

      // Keep local state responsive while recording the new score
      updatedRow = {
        ...post,
        score: newScore,
        comments: existingComments,
        liked_by: likedBy,
        downvoted_by: downvotedBy
      };
    } else {
      console.log(`✅ [Supabase UPDATE Success]: Post #${exactDbId} score updated to ${newScore} in backend database.`);
      updatedRow = res.data[0];
    }
  }

  // Update local storage backup cache if present
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const localList = JSON.parse(raw);
      const updatedList = localList.map(p => 
        String(p.id) === String(exactDbId) 
          ? { ...p, score: newScore, liked_by: likedBy, downvoted_by: downvotedBy, comments: existingComments }
          : p
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    }
  } catch (_) {}

  const postSols = Array.isArray(updatedRow.solutions)
    ? updatedRow.solutions
    : Array.isArray(updatedRow.solution)
      ? updatedRow.solution
      : [];
  const isResolved = updatedRow.resolved === true;

  return {
    ...updatedRow,
    score: newScore,
    solutions: postSols,
    solution: postSols,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open',
    liked_by: likedBy,
    downvoted_by: downvotedBy
  };
}

/**
 * 3. Like (Upvote) a Problem in Supabase
 * Directly updates `score` in the Supabase `posts` table and tracks 1 vote per account.
 */
export async function likeProblem(postId, accountId = 'default-account') {
  return voteProblem(postId, accountId, 'up');
}

/**
 * 3b. Downvote a Problem in Supabase
 * Directly decrements `score` in the Supabase `posts` table and tracks 1 vote per account.
 */
export async function downvoteProblem(postId, accountId = 'default-account') {
  return voteProblem(postId, accountId, 'down');
}

/**
 * 4. Submit a Solution to Supabase
 * Appends the solution object to the `solutions` JSON column in the Supabase `posts` table.
 * Caches locally so solutions remain immediately visible.
 */
export async function submitSolution(postId, { title, desc, proposed_approach, author_id, author_email, author_name, author_role }) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Derive author details
  let resolvedAuthorId = author_id || null;
  let resolvedAuthorEmail = author_email || null;
  let resolvedAuthorName = author_name;
  let resolvedAuthorRole = author_role || 'university';

  try {
    const saved = localStorage.getItem('fl_active_account');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!resolvedAuthorId && parsed.id) resolvedAuthorId = parsed.id;
      if (!resolvedAuthorEmail && parsed.email) resolvedAuthorEmail = parsed.email;
      if (!resolvedAuthorName) {
        resolvedAuthorName = parsed.name || (parsed.email ? parsed.email.split('@')[0] : null);
      }
      if (parsed.role) resolvedAuthorRole = parsed.role;
    }
  } catch (e) {}

  if (!resolvedAuthorName) resolvedAuthorName = 'Academic / Enterprise Partner';

  const solutionPayload = {
    problem_id: postId,
    id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    desc: desc.trim(),
    proposed_approach: (proposed_approach || desc).trim(),
    author_id: resolvedAuthorId,
    author_email: resolvedAuthorEmail,
    author_name: resolvedAuthorName,
    author_role: resolvedAuthorRole,
    created_at: new Date().toISOString()
  };

  console.log(`📡 [Supabase UPDATE]: Submitting solution for post #${postId}...`, solutionPayload);

  // 1. Fetch current post from Supabase
  const { data: post, error: fetchErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchErr) {
    console.error('❌ [Supabase SELECT Error (submitSolution)]:', fetchErr);
    throw new Error(`Failed to fetch post #${postId} before saving solution: ${fetchErr.message}`);
  }

  const existingSolutions = Array.isArray(post.solutions)
    ? post.solutions
    : Array.isArray(post.solution)
      ? post.solution
      : [];

  const updatedSolutions = [
    solutionPayload,
    ...existingSolutions.filter(s => s.id !== solutionPayload.id)
  ];

  // 2. Update solutions directly in Supabase
  let updateResult = null;
  let updateError = null;

  const { data: dataSolutions, error: errorSolutions } = await supabase
    .from('posts')
    .update({ solutions: updatedSolutions })
    .eq('id', postId)
    .select();

  if (errorSolutions) {
    // If backend column is named 'solution', fallback to 'solution'
    if (errorSolutions.message?.includes('solution') || errorSolutions.code === 'PGRST204') {
      console.log('🔄 Attempting fallback to "solution" column...');
      const { data: dataSolution, error: errorSolution } = await supabase
        .from('posts')
        .update({ solution: updatedSolutions })
        .eq('id', postId)
        .select();

      if (errorSolution) {
        updateError = errorSolution;
      } else {
        updateResult = dataSolution;
      }
    } else {
      updateError = errorSolutions;
    }
  } else {
    updateResult = dataSolutions;
  }

  if (updateError) {
    console.error('❌ [Supabase UPDATE Error (submitSolution)]:', {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint
    });
    if (updateError.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts.solutions".');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and add an UPDATE policy allowing users to submit solutions.');
    }
    throw new Error(`Supabase failed to save solution: ${updateError.message} (code: ${updateError.code})`);
  }

  if (!updateResult || updateResult.length === 0) {
    const rlsErr = new Error('Supabase UPDATE returned 0 rows. Row-Level Security (RLS) on the "posts" table may have blocked updating this problem.');
    console.error('🚨 [Supabase RLS Error]:', rlsErr.message);
    throw rlsErr;
  }

  const savedRecord = updateResult[0];
  const isResolved = savedRecord.resolved === true;
  const finalPost = {
    ...savedRecord,
    solutions: updatedSolutions,
    solution: updatedSolutions,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open'
  };

  console.log(`✅ [Supabase UPDATE Success]: Solution saved to post #${postId} in Supabase:`, finalPost);
  return finalPost;
}

/**
 * 4c. Delete a Solution from Supabase (Solution Author Only)
 * Removes a specific solution by id from the solutions JSON column.
 */
export async function deleteSolution(postId, solutionId, currentAccount) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  if (!postId || !solutionId) {
    throw new Error('Problem ID and Solution ID are required to delete a solution.');
  }

  console.log(`📡 [Supabase UPDATE]: Deleting solution #${solutionId} from post #${postId}...`);

  // 1. Fetch current post from Supabase
  const { data: post, error: fetchErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchErr) {
    console.error('❌ [Supabase SELECT Error (deleteSolution)]:', fetchErr);
    throw new Error(`Failed to fetch problem #${postId}: ${fetchErr.message}`);
  }

  const existingSolutions = Array.isArray(post.solutions)
    ? post.solutions
    : Array.isArray(post.solution)
      ? post.solution
      : [];

  const targetSolution = existingSolutions.find(s => s.id === solutionId);
  if (!targetSolution) {
    console.warn(`⚠️ Solution #${solutionId} not found in post #${postId}.`);
    return {
      ...post,
      solutions: existingSolutions,
      solution: existingSolutions,
      resolved: post.resolved === true,
      status: post.resolved === true ? 'Resolved' : 'Open'
    };
  }

  // Verify ownership
  if (currentAccount && !isSolutionAuthor(targetSolution, currentAccount)) {
    const err = new Error('Unauthorized: You can only delete solutions that you have posted.');
    console.error('❌ [Auth Error]:', err.message);
    throw err;
  }

  const updatedSolutions = existingSolutions.filter(s => s.id !== solutionId);

  // 2. Update solutions in Supabase
  let updateResult = null;
  let updateError = null;

  const { data: dataSolutions, error: errorSolutions } = await supabase
    .from('posts')
    .update({ solutions: updatedSolutions })
    .eq('id', postId)
    .select();

  if (errorSolutions) {
    if (errorSolutions.message?.includes('solution') || errorSolutions.code === 'PGRST204') {
      const { data: dataSolution, error: errorSolution } = await supabase
        .from('posts')
        .update({ solution: updatedSolutions })
        .eq('id', postId)
        .select();

      if (errorSolution) updateError = errorSolution;
      else updateResult = dataSolution;
    } else {
      updateError = errorSolutions;
    }
  } else {
    updateResult = dataSolutions;
  }

  if (updateError) {
    console.error('❌ [Supabase UPDATE Error (deleteSolution)]:', updateError);
    if (updateError.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked deleting solution on "posts.solutions".');
    }
    throw new Error(`Supabase failed to delete solution: ${updateError.message} (code: ${updateError.code})`);
  }

  const savedRecord = updateResult && updateResult.length > 0 ? updateResult[0] : post;
  const isResolved = savedRecord.resolved === true;
  const finalPost = {
    ...savedRecord,
    solutions: updatedSolutions,
    solution: updatedSolutions,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open'
  };

  console.log(`✅ [Supabase UPDATE Success]: Solution #${solutionId} successfully deleted from post #${postId}:`, finalPost);
  return finalPost;
}

/**
 * 4b. Mark Problem as Resolved or Open (Citizen Author Only)
 * Directly updates the `resolved` boolean column (true/false) in Supabase.
 */
export async function toggleProblemStatus(postId, targetStatus, currentAccount) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase SELECT]: Fetching problem #${postId} to check resolved boolean...`);
  const { data: postRecord, error: fetchErr } = await supabase
    .from('posts')
    .select('id, resolved, title')
    .eq('id', postId)
    .single();

  if (fetchErr) {
    console.error('❌ [Supabase SELECT Error (toggleProblemStatus)]:', fetchErr);
    throw new Error(`Failed to fetch problem #${postId}: ${fetchErr.message}`);
  }

  const currentlyResolved = postRecord?.resolved === true;
  let newResolvedBool = !currentlyResolved;
  if (targetStatus === 'Resolved' || targetStatus === true) {
    newResolvedBool = true;
  } else if (targetStatus === 'Open' || targetStatus === false) {
    newResolvedBool = false;
  }

  console.log(`📡 [Supabase UPDATE]: Updating post #${postId} -> resolved: ${newResolvedBool}...`);

  const { data, error } = await supabase
    .from('posts')
    .update({ resolved: newResolvedBool })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (toggleProblemStatus)]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts.resolved" (code 42501).');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and verify UPDATE policy on "posts".');
    }
    throw new Error(`Supabase UPDATE failed for resolved status: ${error.message} (code: ${error.code})`);
  }

  if (!data || data.length === 0) {
    const rlsErr = new Error('Supabase UPDATE returned 0 rows for resolved status. RLS may have blocked updating this problem.');
    console.error('🚨 [Supabase RLS Error]:', rlsErr.message);
    throw rlsErr;
  }

  const updatedRecord = data[0];
  const finalStatus = newResolvedBool ? 'Resolved' : 'Open';

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} resolved is now ${newResolvedBool} ("${finalStatus}")`);
  return {
    ...updatedRecord,
    resolved: newResolvedBool,
    status: finalStatus
  };
}

export const resolveProblem = (postId, account) => toggleProblemStatus(postId, 'Resolved', account);
export const reopenProblem = (postId, account) => toggleProblemStatus(postId, 'Open', account);

/**
 * 5. Fetch Solutions for a Problem directly from Supabase
 */
export async function getSolutions(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('❌ [Supabase SELECT Error (getSolutions)]:', error);
    throw new Error(`Supabase getSolutions failed: ${error.message}`);
  }

  const dbSols = Array.isArray(data?.solutions)
    ? data.solutions
    : Array.isArray(data?.solution)
      ? data.solution
      : [];

  return dbSols;
}

/**
 * ==============================================================================
 * UNIVERSITY WORKSPACE & ACCEPTED CHALLENGES SERVICE
 * ==============================================================================
 */
const ACCEPTED_CHALLENGES_KEY = 'fl_accepted_challenges';

export function getAcceptedChallenges(universityId = null) {
  try {
    const raw = localStorage.getItem(ACCEPTED_CHALLENGES_KEY);
    let list = raw ? JSON.parse(raw) : INITIAL_ACCEPTED_CHALLENGES;
    // Purge legacy sample challenges ('ac-1', 'ac-2') if previously saved in browser localStorage
    if (Array.isArray(list) && list.some(c => c.id === 'ac-1' || c.id === 'ac-2')) {
      list = list.filter(c => c.id !== 'ac-1' && c.id !== 'ac-2');
      localStorage.setItem(ACCEPTED_CHALLENGES_KEY, JSON.stringify(list));
    }
    if (!raw) {
      localStorage.setItem(ACCEPTED_CHALLENGES_KEY, JSON.stringify(INITIAL_ACCEPTED_CHALLENGES));
    }
    if (universityId) {
      return list.filter(c => c.universityId === universityId);
    }
    return list;
  } catch (e) {
    return INITIAL_ACCEPTED_CHALLENGES;
  }
}

export function saveAcceptedChallenges(list) {
  try {
    localStorage.setItem(ACCEPTED_CHALLENGES_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fl_challenge_accepted', { detail: list }));
    }
  } catch (e) {
    console.error('Failed to save accepted challenges:', e);
  }
}

export function calculateProgress(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
}

export function acceptChallenge(post, universityAccount) {
  if (!post || !universityAccount) return null;
  const list = getAcceptedChallenges();
  const existing = list.find(c => String(c.postId) === String(post.id));
  if (existing) {
    if (existing.universityId === universityAccount.id) {
      return existing;
    }
    const lockedMsg = `This problem has already been accepted by ${existing.universityName || 'another university'} and is locked.`;
    console.warn(lockedMsg);
    throw new Error(lockedMsg);
  }

  const initialMilestones = [
    { id: `m-${Date.now()}-1`, title: 'Phase 1: Field Investigation & Scope Definition', deadline: 'Jan 30, 2027', completed: false },
    { id: `m-${Date.now()}-2`, title: 'Phase 2: Prototype Development & Testing', deadline: 'Mar 15, 2027', completed: false }
  ];

  const newClaim = {
    id: `ac-${Date.now()}`,
    postId: post.id,
    title: post.title,
    category: post.category || 'Infrastructure',
    milestoneDeadline: 'Jan 30, 2027',
    milestones: initialMilestones,
    progress: calculateProgress(initialMilestones),
    team: [
      { name: universityAccount.name || 'Faculty Lead', initials: (universityAccount.initials || 'FL') }
    ],
    universityId: universityAccount.id,
    universityName: universityAccount.name || 'University Research Lab',
    fundedByIndustry: null,
    status: 'In Progress',
    acceptedAt: new Date().toISOString()
  };

  const updated = [newClaim, ...list];
  saveAcceptedChallenges(updated);
  return newClaim;
}

export function addMilestone(postId, milestoneData) {
  if (!postId || !milestoneData || !milestoneData.title?.trim()) return null;
  const list = getAcceptedChallenges();
  const updated = list.map(c => {
    if (String(c.postId) === String(postId)) {
      const currentMilestones = c.milestones || [];
      const newM = {
        id: `m-${Date.now()}`,
        title: milestoneData.title.trim(),
        deadline: milestoneData.deadline || 'TBD',
        completed: false
      };
      const newMilestones = [...currentMilestones, newM];
      return {
        ...c,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones),
        milestoneDeadline: milestoneData.deadline || c.milestoneDeadline
      };
    }
    return c;
  });
  saveAcceptedChallenges(updated);
  return updated.find(c => String(c.postId) === String(postId));
}

export function toggleMilestone(postId, milestoneId) {
  if (!postId || !milestoneId) return null;
  const list = getAcceptedChallenges();
  const updated = list.map(c => {
    if (String(c.postId) === String(postId)) {
      const currentMilestones = c.milestones || [];
      const newMilestones = currentMilestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      return {
        ...c,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones)
      };
    }
    return c;
  });
  saveAcceptedChallenges(updated);
  return updated.find(c => String(c.postId) === String(postId));
}

export function deleteMilestone(postId, milestoneId) {
  if (!postId || !milestoneId) return null;
  const list = getAcceptedChallenges();
  const updated = list.map(c => {
    if (String(c.postId) === String(postId)) {
      const currentMilestones = c.milestones || [];
      const newMilestones = currentMilestones.filter(m => m.id !== milestoneId);
      return {
        ...c,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones)
      };
    }
    return c;
  });
  saveAcceptedChallenges(updated);
  return updated.find(c => String(c.postId) === String(postId));
}

export function isProblemLocked(postId) {
  if (!postId) return false;
  const list = getAcceptedChallenges();
  return list.some(c => String(c.postId) === String(postId));
}

export function getProblemLockInfo(postId) {
  if (!postId) return null;
  const list = getAcceptedChallenges();
  const claim = list.find(c => String(c.postId) === String(postId));
  if (!claim) return null;
  return {
    isLocked: true,
    universityId: claim.universityId,
    universityName: claim.universityName,
    progress: claim.progress || 0,
    acceptedAt: claim.acceptedAt
  };
}

export function isProblemAcceptedByOtherUniversity(postId, currentUniversityId) {
  if (!postId) return false;
  const list = getAcceptedChallenges();
  const claim = list.find(c => String(c.postId) === String(postId));
  if (!claim) return false;
  return Boolean(currentUniversityId && claim.universityId !== currentUniversityId);
}

export function fundChallenge(postId, industryAccount) {
  if (!postId || !industryAccount) return null;
  const list = getAcceptedChallenges();
  const updated = list.map(c => {
    if (String(c.postId) === String(postId)) {
      return {
        ...c,
        fundedByIndustry: {
          id: industryAccount.id,
          name: industryAccount.name || 'Industry Sponsor',
          fundedAt: new Date().toISOString()
        }
      };
    }
    return c;
  });
  saveAcceptedChallenges(updated);
  return updated.find(c => String(c.postId) === String(postId));
}

export function canAccessWorkspace(postId, account) {
  if (!postId || !account) return false;
  const list = getAcceptedChallenges();
  const claim = list.find(c => String(c.postId) === String(postId));
  if (!claim) return false;

  // University check: Only the university that accepted it
  if (account.role === 'university') {
    return claim.universityId === account.id;
  }

  // Industry check: Exclusively visible if industry accepts to fund it
  if (account.role === 'industry') {
    return claim.fundedByIndustry && (claim.fundedByIndustry.id === account.id || claim.fundedByIndustry.id === 'ind-1');
  }

  return false;
}

export function getChallengeWorkspace(postId) {
  const list = getAcceptedChallenges();
  return list.find(c => String(c.postId) === String(postId)) || null;
}

/**
 * ==============================================================================
 * UNIVERSITY TEAM & STUDENT MANAGEMENT SERVICE
 * ==============================================================================
 */

const DEFAULT_STUDENTS = [
  {
    id: 'stu-1',
    name: 'Aarav Deshmukh',
    role: 'Embedded Systems Lead',
    department: 'Electrical Engineering',
    email: 'aarav.d@univ.edu.in',
    initials: 'AD'
  },
  {
    id: 'stu-2',
    name: 'Pooja Sundaram',
    role: 'Water Quality Analyst',
    department: 'Chemical Engineering',
    email: 'pooja.s@univ.edu.in',
    initials: 'PS'
  },
  {
    id: 'stu-3',
    name: 'Rohan Mehra',
    role: 'IoT Firmware Developer',
    department: 'Computer Science & Engineering',
    email: 'rohan.m@univ.edu.in',
    initials: 'RM'
  },
  {
    id: 'stu-4',
    name: 'Sneha Kulkarni',
    role: 'GIS & Spatial Mapping Specialist',
    department: 'Geoinformatics',
    email: 'sneha.k@univ.edu.in',
    initials: 'SK'
  }
];

const DEFAULT_TEAMS = [
  {
    id: 'team-1',
    name: 'AquaPure Research Cohort',
    description: 'Multidisciplinary sensor telemetry and community water filtration engineering group.',
    department: 'Environmental & Sensor Engineering',
    studentIds: ['stu-1', 'stu-2', 'stu-3'],
    assignedProblemIds: []
  }
];

let memoryTeamsCache = {};

/**
 * Format team object from Supabase row, isolating by requesting university if specified
 */
function formatTeamRow(row, requestingUniversityId = null) {
  if (!row) return null;
  const associated = Array.isArray(row.associated_to) ? row.associated_to.map(String) : [];
  
  // Parse members JSON
  let membersList = [];
  let description = '';
  let department = 'Multidisciplinary Team';
  let teamUniversityId = null;
  let teamUniversityName = '';

  if (row.university_id) {
    teamUniversityId = String(row.university_id);
  }

  if (Array.isArray(row.members)) {
    membersList = row.members;
    const withUni = row.members.find(m => m && (m.university_id || m.universityId));
    if (withUni) {
      teamUniversityId = String(withUni.university_id || withUni.universityId);
    }
  } else if (row.members && typeof row.members === 'object') {
    if (row.members.university_id || row.members.universityId) {
      teamUniversityId = String(row.members.university_id || row.members.universityId);
    }
    if (row.members.university_name || row.members.universityName) {
      teamUniversityName = row.members.university_name || row.members.universityName;
    }
    if (Array.isArray(row.members.students)) {
      membersList = row.members.students;
    } else if (Array.isArray(row.members.list)) {
      membersList = row.members.list;
    } else if (Array.isArray(row.members.members)) {
      membersList = row.members.members;
    }
    if (row.members.description) description = row.members.description;
    if (row.members.department) department = row.members.department;
  }

  // If team has assigned problems in associated_to, correlate with accepted challenges
  if (!teamUniversityId && associated.length > 0) {
    const allClaims = getAcceptedChallenges();
    const matchingClaim = allClaims.find(c => associated.includes(String(c.postId)));
    if (matchingClaim && matchingClaim.universityId) {
      teamUniversityId = String(matchingClaim.universityId);
      teamUniversityName = matchingClaim.universityName || '';
    }
  }

  // Correlate with local storage team IDs for university ownership
  if (!teamUniversityId && requestingUniversityId) {
    try {
      const localIdsRaw = localStorage.getItem(`fl_uni_team_ids_${requestingUniversityId}`);
      if (localIdsRaw) {
        const ids = JSON.parse(localIdsRaw);
        if (Array.isArray(ids) && ids.some(id => String(id) === String(row.id))) {
          teamUniversityId = String(requestingUniversityId);
        }
      }
    } catch (e) {}
  }

  // Filter members: Never allow students from another university into this university's team
  const targetUniId = requestingUniversityId || teamUniversityId;
  const filteredMembers = membersList.filter(m => {
    if (!m) return false;
    if (targetUniId && m.university_id && String(m.university_id) !== String(targetUniId)) {
      return false;
    }
    if (targetUniId && m.universityId && String(m.universityId) !== String(targetUniId)) {
      return false;
    }
    return true;
  });

  return {
    id: row.id,
    name: row.name || 'Untitled Team',
    description: description,
    department: department,
    universityId: teamUniversityId,
    universityName: teamUniversityName,
    associated_to: associated,
    assignedProblemIds: associated,
    members: filteredMembers,
    studentIds: filteredMembers.map(m => m.id || m.email || m.name),
    created_at: row.created_at
  };
}

/**
 * Verifies if a team belongs strictly to a specified university
 */
export function isTeamOwnedByUniversity(team, universityId) {
  if (!team || !universityId) return false;

  // 1. Direct universityId match on formatted team
  if (team.universityId && String(team.universityId) === String(universityId)) {
    return true;
  }

  // 2. Stored in this university's local team IDs registry
  try {
    const localIdsRaw = localStorage.getItem(`fl_uni_team_ids_${universityId}`);
    if (localIdsRaw) {
      const ids = JSON.parse(localIdsRaw);
      if (Array.isArray(ids) && ids.some(id => String(id) === String(team.id))) {
        return true;
      }
    }
  } catch (e) {}

  // 3. Team assigned to a problem accepted by this university
  const acceptedChallenges = getAcceptedChallenges(universityId);
  const myProblemIds = new Set(acceptedChallenges.map(c => String(c.postId)));
  const teamProblemIds = (team.associated_to || team.assignedProblemIds || []).map(String);
  if (teamProblemIds.length > 0 && teamProblemIds.some(pid => myProblemIds.has(pid))) {
    return true;
  }

  // 4. Team has members tagged with this universityId and none tagged with another
  if (Array.isArray(team.members) && team.members.length > 0) {
    const hasMyStudent = team.members.some(m => 
      m && (String(m.university_id) === String(universityId) || String(m.universityId) === String(universityId))
    );
    const hasOtherStudent = team.members.some(m => 
      m && (m.university_id || m.universityId) && 
      String(m.university_id || m.universityId) !== String(universityId)
    );
    if (hasMyStudent && !hasOtherStudent) {
      return true;
    }
  }

  // 5. If registered under another university's local registry, reject
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fl_uni_team_ids_') && key !== `fl_uni_team_ids_${universityId}`) {
        const otherIds = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(otherIds) && otherIds.some(id => String(id) === String(team.id))) {
          return false;
        }
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Fetch teams strictly isolated for a given university from Supabase
 */
export async function fetchUniversityTeams(universityId = null) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase SELECT]: Fetching research teams from "teams" table for university "${universityId}"...`);
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [Supabase SELECT Error (teams)]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      throw new Error(`Row Level Security (RLS) blocked reading the "teams" table (code: 42501). Add a SELECT policy in your Supabase dashboard.`);
    }
    if (error.code === '42P01') {
      throw new Error(`Table "teams" does not exist in your Supabase database (code: 42P01). Please create the "teams" table.`);
    }
    throw new Error(`Failed to load teams from Supabase: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  const formatted = (data || []).map(row => formatTeamRow(row, universityId));

  if (universityId) {
    const filtered = formatted.filter(t => isTeamOwnedByUniversity(t, universityId));
    try {
      localStorage.setItem(`fl_uni_teams_${universityId}`, JSON.stringify(filtered));
    } catch (e) {}
    if (!memoryTeamsCache || typeof memoryTeamsCache !== 'object') memoryTeamsCache = {};
    memoryTeamsCache[universityId] = filtered;
    return filtered;
  }

  return formatted;
}

export function getUniversityTeams(universityId = null) {
  if (universityId) {
    if (memoryTeamsCache && Array.isArray(memoryTeamsCache[universityId])) {
      return memoryTeamsCache[universityId];
    }
    try {
      const raw = localStorage.getItem(`fl_uni_teams_${universityId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }
  return [];
}

export function getUniversityStudents(universityId = null) {
  const currentTeams = getUniversityTeams(universityId);
  const uniqueStudents = [];
  const seenIds = new Set();
  
  currentTeams.forEach(team => {
    (team.members || []).forEach(member => {
      if (member && (member.id || member.email || member.name)) {
        if (universityId && member.university_id && String(member.university_id) !== String(universityId)) {
          return;
        }
        if (universityId && member.universityId && String(member.universityId) !== String(universityId)) {
          return;
        }
        const key = member.id || member.email || member.name;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          uniqueStudents.push(member);
        }
      }
    });
  });

  return uniqueStudents;
}

/**
 * Create a new team in Supabase 'teams' table
 */
export async function createUniversityTeam(universityId, teamData) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  if (!teamData || !teamData.name?.trim()) {
    throw new Error('Team name is required.');
  }

  const associated = Array.isArray(teamData.associated_to)
    ? teamData.associated_to.map(String)
    : (Array.isArray(teamData.assignedProblemIds) ? teamData.assignedProblemIds.map(String) : []);

  let membersList = [];
  if (Array.isArray(teamData.members)) {
    membersList = teamData.members;
  } else if (Array.isArray(teamData.students)) {
    membersList = teamData.students;
  } else if (Array.isArray(teamData.studentIds)) {
    const allStudents = getUniversityStudents(universityId);
    membersList = allStudents.filter(s => teamData.studentIds.includes(s.id));
  }

  const taggedStudents = membersList.map(m => ({
    ...m,
    university_id: universityId,
    universityId: universityId
  }));

  const membersMeta = {
    university_id: universityId,
    university_name: teamData.universityName || '',
    description: (teamData.description || '').trim(),
    department: (teamData.department || 'Multidisciplinary Team').trim(),
    students: taggedStudents
  };

  const payload = {
    name: teamData.name.trim(),
    associated_to: associated,
    members: membersMeta
  };

  console.log('📡 [Supabase INSERT]: Adding new team to "teams" table for university:', universityId, payload);
  const { data, error } = await supabase
    .from('teams')
    .insert([payload])
    .select();

  if (error) {
    console.error('❌ [Supabase INSERT Error (teams)]:', error);
    if (error.code === '42501') {
      throw new Error(`Row Level Security (RLS) blocked inserting into "teams" table (code: 42501). Add an INSERT policy for authenticated/public users in Supabase.`);
    }
    throw new Error(`Failed to create team in Supabase: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  if (!data || data.length === 0) {
    throw new Error('Supabase INSERT returned no data. Check if an RLS SELECT policy is preventing reading the inserted row.');
  }

  const created = formatTeamRow(data[0], universityId);

  try {
    const key = `fl_uni_team_ids_${universityId}`;
    const raw = localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    if (!ids.some(id => String(id) === String(created.id))) {
      ids.push(String(created.id));
      localStorage.setItem(key, JSON.stringify(ids));
    }
    const current = getUniversityTeams(universityId);
    const updated = [created, ...current.filter(t => String(t.id) !== String(created.id))];
    localStorage.setItem(`fl_uni_teams_${universityId}`, JSON.stringify(updated));
  } catch (e) {}

  if (!memoryTeamsCache || typeof memoryTeamsCache !== 'object') memoryTeamsCache = {};
  if (!Array.isArray(memoryTeamsCache[universityId])) memoryTeamsCache[universityId] = [];
  memoryTeamsCache[universityId] = [created, ...memoryTeamsCache[universityId].filter(t => String(t.id) !== String(created.id))];

  return created;
}

/**
 * Update an existing team in Supabase 'teams' table
 */
export async function updateUniversityTeam(universityId, teamId, teamData) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  if (!teamId) {
    throw new Error('Team ID is required for update.');
  }

  const payload = {};
  if (typeof teamData.name === 'string') {
    payload.name = teamData.name.trim();
  }

  if (Array.isArray(teamData.associated_to)) {
    payload.associated_to = teamData.associated_to.map(String);
  } else if (Array.isArray(teamData.assignedProblemIds)) {
    payload.associated_to = teamData.assignedProblemIds.map(String);
  }

  if (teamData.members !== undefined) {
    let rawMembers = teamData.members;
    let studentsList = [];
    let desc = '';
    let dept = '';
    if (Array.isArray(rawMembers)) {
      studentsList = rawMembers;
    } else if (rawMembers && typeof rawMembers === 'object') {
      studentsList = rawMembers.students || rawMembers.list || rawMembers.members || [];
      desc = rawMembers.description || '';
      dept = rawMembers.department || '';
    } else if (Array.isArray(teamData.students)) {
      studentsList = teamData.students;
    } else if (Array.isArray(teamData.studentIds)) {
      const allStudents = getUniversityStudents(universityId);
      studentsList = allStudents.filter(s => teamData.studentIds.includes(s.id));
    }

    payload.members = {
      university_id: universityId,
      description: desc || teamData.description || '',
      department: dept || teamData.department || 'Multidisciplinary Team',
      students: studentsList.map(s => ({
        ...s,
        university_id: s.university_id || universityId,
        universityId: s.universityId || universityId
      }))
    };
  }

  const targetId = !isNaN(Number(teamId)) ? Number(teamId) : teamId;
  console.log(`📡 [Supabase UPDATE]: Updating team #${targetId} in "teams" table:`, payload);

  const { data, error } = await supabase
    .from('teams')
    .update(payload)
    .eq('id', targetId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (teams)]:', error);
    if (error.code === '42501') {
      throw new Error(`Row Level Security (RLS) blocked updating "teams" table (code: 42501). Check UPDATE policy on "teams" in Supabase.`);
    }
    throw new Error(`Failed to update team in Supabase: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  const updated = formatTeamRow(data && data.length > 0 ? data[0] : { id: targetId, ...payload }, universityId);
  try {
    const current = getUniversityTeams(universityId);
    const updatedList = current.map(t => String(t.id) === String(targetId) ? updated : t);
    localStorage.setItem(`fl_uni_teams_${universityId}`, JSON.stringify(updatedList));
  } catch (e) {}

  if (memoryTeamsCache && Array.isArray(memoryTeamsCache[universityId])) {
    memoryTeamsCache[universityId] = memoryTeamsCache[universityId].map(t => String(t.id) === String(targetId) ? updated : t);
  }
  return updated;
}

/**
 * Delete a team from Supabase 'teams' table
 */
export async function deleteUniversityTeam(universityId, teamId) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  if (!teamId) {
    throw new Error('Team ID is required to delete.');
  }

  const targetId = !isNaN(Number(teamId)) ? Number(teamId) : teamId;
  console.log(`📡 [Supabase DELETE]: Deleting team #${targetId} from "teams" table...`);

  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('id', targetId);

  if (error) {
    console.error('❌ [Supabase DELETE Error (teams)]:', error);
    if (error.code === '42501') {
      throw new Error(`Row Level Security (RLS) blocked deleting from "teams" table (code: 42501). Check DELETE policy on "teams" in Supabase.`);
    }
    throw new Error(`Failed to delete team from Supabase: ${error.message} (code: ${error.code || 'unknown'})`);
  }

  try {
    const key = `fl_uni_team_ids_${universityId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const ids = JSON.parse(raw).filter(id => String(id) !== String(targetId));
      localStorage.setItem(key, JSON.stringify(ids));
    }
    const current = getUniversityTeams(universityId);
    const updated = current.filter(t => String(t.id) !== String(targetId));
    localStorage.setItem(`fl_uni_teams_${universityId}`, JSON.stringify(updated));
  } catch (e) {}

  if (memoryTeamsCache && Array.isArray(memoryTeamsCache[universityId])) {
    memoryTeamsCache[universityId] = memoryTeamsCache[universityId].filter(t => String(t.id) !== String(targetId));
  }
  return { success: true, id: targetId };
}

/**
 * Toggle Problem Assignment for a team in Supabase
 */
export async function toggleTeamProblemAssignment(universityId, teamId, postId) {
  if (!teamId || !postId) {
    throw new Error('Team ID and Problem ID are required.');
  }

  const targetId = !isNaN(Number(teamId)) ? Number(teamId) : teamId;

  // Fetch current team row to guarantee fresh list
  const { data: teamRow, error: fetchErr } = await supabase
    .from('teams')
    .select('*')
    .eq('id', targetId)
    .single();

  if (fetchErr) {
    throw new Error(`Failed to fetch team #${targetId} to update problems: ${fetchErr.message}`);
  }

  const currentList = Array.isArray(teamRow.associated_to) ? teamRow.associated_to.map(String) : [];
  const postStr = String(postId);
  const nextList = currentList.includes(postStr)
    ? currentList.filter(id => id !== postStr)
    : [...currentList, postStr];

  return await updateUniversityTeam(universityId, targetId, { associated_to: nextList });
}

/**
 * Add a student to designated teams in Supabase 'teams' table
 */
export async function addUniversityStudent(universityId, studentData) {
  if (!studentData || !studentData.name?.trim()) {
    throw new Error('Student name is required.');
  }

  const name = studentData.name.trim();
  const parts = name.split(' ');
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const newStudent = {
    id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    role: studentData.role?.trim() || 'Student Researcher',
    department: studentData.department?.trim() || 'Engineering & Technology',
    email: studentData.email?.trim() || '',
    initials,
    university_id: universityId,
    universityId: universityId
  };

  const targetTeamIds = Array.isArray(studentData.teamIds) ? studentData.teamIds : [];
  if (targetTeamIds.length === 0) {
    throw new Error('Please select at least one team to assign this student researcher to.');
  }

  // Update each targeted team in Supabase
  for (const teamId of targetTeamIds) {
    const targetId = !isNaN(Number(teamId)) ? Number(teamId) : teamId;
    const { data: currentTeam, error: fetchErr } = await supabase
      .from('teams')
      .select('*')
      .eq('id', targetId)
      .single();

    if (fetchErr) {
      throw new Error(`Failed to fetch team #${targetId} to add student: ${fetchErr.message}`);
    }

    let currentMembers = [];
    let desc = '';
    let dept = '';
    let teamUniId = universityId;

    if (Array.isArray(currentTeam.members)) {
      currentMembers = currentTeam.members;
    } else if (currentTeam.members && typeof currentTeam.members === 'object') {
      currentMembers = currentTeam.members.students || currentTeam.members.list || currentTeam.members.members || [];
      desc = currentTeam.members.description || '';
      dept = currentTeam.members.department || '';
      if (currentTeam.members.university_id) teamUniId = currentTeam.members.university_id;
    }

    // Isolate members: keep only members belonging to this university
    const cleanMembers = currentMembers.filter(m => {
      if (!m) return false;
      if (m.university_id && String(m.university_id) !== String(universityId)) return false;
      if (m.universityId && String(m.universityId) !== String(universityId)) return false;
      return true;
    });

    const updatedMembersPayload = {
      university_id: teamUniId || universityId,
      description: desc,
      department: dept,
      students: [...cleanMembers, newStudent]
    };

    await updateUniversityTeam(universityId, targetId, { members: updatedMembersPayload });
  }

  return newStudent;
}

/**
 * Update student across all teams in Supabase
 */
export async function updateUniversityStudent(universityId, studentId, studentData) {
  if (!studentId || !studentData) {
    throw new Error('Student ID and data are required.');
  }

  const name = studentData.name?.trim() || 'Student Researcher';
  const parts = name.split(' ');
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const updatedStudentObj = {
    id: studentId,
    name,
    role: studentData.role?.trim() || 'Student Researcher',
    department: studentData.department?.trim() || 'Engineering & Technology',
    email: studentData.email?.trim() || '',
    initials
  };

  // Fetch all teams from Supabase
  const allTeams = await fetchUniversityTeams(universityId);
  const selectedTeamIds = Array.isArray(studentData.teamIds) ? studentData.teamIds.map(String) : [];

  for (const team of allTeams) {
    const isCurrentlyIn = (team.members || []).some(m => String(m.id) === String(studentId));
    const shouldBeIn = selectedTeamIds.includes(String(team.id));

    let nextMembers = null;

    if (isCurrentlyIn && shouldBeIn) {
      // Update details in place
      nextMembers = team.members.map(m => String(m.id) === String(studentId) ? updatedStudentObj : m);
    } else if (!isCurrentlyIn && shouldBeIn) {
      // Add to team
      nextMembers = [...(team.members || []), updatedStudentObj];
    } else if (isCurrentlyIn && !shouldBeIn) {
      // Remove from team
      nextMembers = (team.members || []).filter(m => String(m.id) !== String(studentId));
    }

    if (nextMembers !== null) {
      await updateUniversityTeam(universityId, team.id, { members: nextMembers });
    }
  }

  return updatedStudentObj;
}

/**
 * Delete student from all teams in Supabase
 */
export async function deleteUniversityStudent(universityId, studentId) {
  if (!studentId) {
    throw new Error('Student ID is required to remove.');
  }

  const allTeams = await fetchUniversityTeams(universityId);

  for (const team of allTeams) {
    const hasStudent = (team.members || []).some(m => String(m.id) === String(studentId));
    if (hasStudent) {
      const nextMembers = (team.members || []).filter(m => String(m.id) !== String(studentId));
      await updateUniversityTeam(universityId, team.id, { members: nextMembers });
    }
  }

  return true;
}

export function getTeamsForProblem(universityId, postId) {
  if (!postId) return [];
  const teams = getUniversityTeams(universityId);
  return teams.filter(t => (t.associated_to || []).some(id => String(id) === String(postId)));
}

/**
 * Combined API Service Object
 */
export const postService = {
  getProblems,
  getPosts,
  getPostById,
  createProblem,
  createPost,
  updateProblem,
  updatePost,
  deleteProblem,
  deletePost,
  uploadImageAndCreatePost,
  uploadImageAndUpdatePost,
  isPostAuthor,
  getPostAuthorInfo,
  getPostStatus,
  toggleProblemStatus,
  addComment,
  deleteComment,
  isCommentAuthor,
  formatRelativeTime,
  voteProblem,
  votePost: voteProblem,
  likeProblem,
  likePost: likeProblem,
  downvoteProblem,
  downvotePost: downvoteProblem,
  submitSolution,
  deleteSolution,
  getSolutions,
  isSolutionAuthor,
  filterProblems,
  getAcceptedChallenges,
  acceptChallenge,
  fundChallenge,
  canAccessWorkspace,
  getChallengeWorkspace,
  calculateProgress,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  isProblemLocked,
  getProblemLockInfo,
  isProblemAcceptedByOtherUniversity,
  getUniversityStudents,
  addUniversityStudent,
  updateUniversityStudent,
  deleteUniversityStudent,
  getUniversityTeams,
  fetchUniversityTeams,
  createUniversityTeam,
  updateUniversityTeam,
  deleteUniversityTeam,
  toggleTeamProblemAssignment,
  getTeamsForProblem
};

export { filterProblems };
export const api = postService;
export default postService;
