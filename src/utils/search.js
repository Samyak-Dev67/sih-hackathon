/**
 * Centralized Problem Search & Filtering Engine
 * Supports searching across multiple fields:
 * - Title
 * - Description
 * - Category
 * - ID (exact match or with '#')
 * - Citizen Author Name / User ID
 * - Status ('open' or 'resolved')
 */

export function filterProblems(posts = [], { 
  query = '', 
  category = 'All', 
  status = 'All', 
  sortBy = 'newest' 
} = {}) {
  const cleanQ = (query || '').toLowerCase().trim();
  const searchTerms = cleanQ ? cleanQ.split(/\s+/).filter(Boolean) : [];

  const filtered = posts.filter((post) => {
    if (!post) return false;

    // 1. Category Filter
    if (category && category !== 'All') {
      if ((post.category || '').toLowerCase() !== category.toLowerCase()) {
        return false;
      }
    }

    // 2. Status Filter
    const isResolved = post.resolved === true || (post.status || '').toLowerCase() === 'resolved';
    if (status === 'Open' && isResolved) return false;
    if (status === 'Resolved' && !isResolved) return false;

    // 3. Search Query Matching
    if (searchTerms.length > 0) {
      const idStr = String(post.id || '');
      const titleStr = (post.title || '').toLowerCase();
      const descStr = (post.desc || '').toLowerCase();
      const catStr = (post.category || '').toLowerCase();
      const authorStr = (post.author_name || post.user_id || '').toLowerCase();
      const statusStr = isResolved ? 'resolved' : 'open';

      // Every term in the query must match at least one attribute of the post
      const matchesAllTerms = searchTerms.every((term) => {
        const cleanTerm = term.startsWith('#') ? term.substring(1) : term;
        return (
          idStr === cleanTerm ||
          idStr.includes(cleanTerm) ||
          titleStr.includes(term) ||
          descStr.includes(term) ||
          catStr.includes(term) ||
          authorStr.includes(term) ||
          statusStr.includes(term)
        );
      });

      if (!matchesAllTerms) return false;
    }

    return true;
  });

  // 4. Sorting
  return filtered.sort((a, b) => {
    if (sortBy === 'score') {
      return (Number(b.score) || 0) - (Number(a.score) || 0);
    }
    if (sortBy === 'solutions') {
      const bSolCount = (Array.isArray(b.solutions) ? b.solutions.length : 0) || (Array.isArray(b.solution) ? b.solution.length : 0);
      const aSolCount = (Array.isArray(a.solutions) ? a.solutions.length : 0) || (Array.isArray(a.solution) ? a.solution.length : 0);
      return bSolCount - aSolCount;
    }
    if (sortBy === 'comments') {
      const bComments = Array.isArray(b.comments) ? b.comments.filter(c => c && !c.__meta).length : 0;
      const aComments = Array.isArray(a.comments) ? a.comments.filter(c => c && !c.__meta).length : 0;
      return bComments - aComments;
    }
    // Default: 'newest'
    const dateA = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
    const dateB = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
    return dateB - dateA;
  });
}
