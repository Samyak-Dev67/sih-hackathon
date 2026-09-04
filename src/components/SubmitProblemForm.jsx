import React, { useState } from 'react';
import { CATEGORIES } from '../data/mockData';

export function SubmitProblemForm({ onSubmitProblem, onCancel }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      setErrorMsg('Please provide both a title and description for the problem.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Conceptually sends ONLY the fields matching backend schema:
      // { title, desc, img, category }
      // Do NOT invent id or created_at
      await onSubmitProblem({
        title: title.trim(),
        desc: desc.trim(),
        img: img.trim(),
        category: category || 'Infrastructure'
      });
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting problem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-problem-container">
      <div className="submit-form-card">
        <div className="submit-header">
          <h2>Post a Citizen Problem</h2>
          <p>
            Describe a community problem that universities and industries can design structured solutions for.
          </p>
        </div>

        {errorMsg && (
          <div className="form-error-banner">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="challenge-form">
          {/* Title */}
          <div className="form-field-group">
            <label className="field-label">Problem Title *</label>
            <input 
              type="text"
              required
              className="field-input"
              placeholder="Enter a clear problem title (e.g., Lorem ipsum dolor sit amet)"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrorMsg(''); }}
            />
          </div>

          {/* Category */}
          <div className="form-field-group">
            <label className="field-label">Category *</label>
            <select 
              className="field-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-field-group">
            <label className="field-label">Problem Description *</label>
            <textarea 
              rows={5}
              required
              className="field-textarea"
              placeholder="Describe the issue, context, affected neighborhood, or requirements in detail..."
              value={desc}
              onChange={(e) => { setDesc(e.target.value); setErrorMsg(''); }}
            />
          </div>

          {/* Image URL if applicable */}
          <div className="form-field-group">
            <label className="field-label">Image URL (Optional)</label>
            <input 
              type="url"
              className="field-input"
              placeholder="https://example.com/photo.jpg"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions-row">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onCancel}
              disabled={loading}
            >
              Discard Draft
            </button>
            <button 
              type="submit" 
              className="btn btn-blue"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Post Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
