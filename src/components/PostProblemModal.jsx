import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle, Send, Building2, Users, GraduationCap } from 'lucide-react';

export function PostProblemModal({ isOpen, onClose, onAddProblem, currentUser }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [summary, setSummary] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [orgName, setOrgName] = useState(currentUser?.organization || currentUser?.name || 'Department of Public Works');
  const [orgType, setOrgType] = useState(currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Government');
  const [grant, setGrant] = useState(',000 Pilot Grant');
  const [tagsInput, setTagsInput] = useState('Open Challenge, Civic Innovation');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!tags.includes(category)) tags.unshift(category);

    const newProblem = {
      id: 'prob-' + Date.now(),
      code: 'FL-' + Math.floor(1000 + Math.random() * 9000),
      title: title.trim(),
      orgName: orgName.trim(),
      orgType: orgType,
      orgInitials: orgName.trim().slice(0, 2).toUpperCase(),
      postedTime: 'Just now',
      status: 'OPEN',
      category: category,
      upvotes: 1,
      hasUpvoted: true,
      summary: summary.trim(),
      detailedDescription: detailedDescription.trim() || summary.trim(),
      tags: tags,
      contributorsCount: 1,
      universityTeamsCount: 0,
      daysLeft: 30,
      bountyOrGrant: grant.trim(),
      sponsoringBody: orgName.trim(),
      proposals: []
    };

    onAddProblem(newProblem);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card post-problem-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="post-modal-header">
          <h2 className="post-headline">Post a Real-World Problem</h2>
          <p className="post-subtext">
            Publish an infrastructure, social, or industrial challenge to mobilize university research teams and citizen collaborators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="post-problem-form">
          <div className="form-group">
            <label className="input-field-label">Problem Statement / Title</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. How can urban heat islands be mapped with low-cost vehicular sensors?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="input-field-label">Domain Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="text-select"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Climate">Climate</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Energy">Energy</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div className="form-group">
              <label className="input-field-label">Sponsoring Grant / Reward (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. ,000 Pilot Implementation"
                value={grant}
                onChange={(e) => setGrant(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="input-field-label">Publishing Organization / Body</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Smart City Mission / Apex Motors"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="input-field-label">Organization Sector</label>
              <select 
                value={orgType} 
                onChange={(e) => setOrgType(e.target.value)}
                className="text-select"
              >
                <option value="Government">Government / Public Agency</option>
                <option value="Industry">Industry / Corporate Enterprise</option>
                <option value="University">University / Academic Institute</option>
                <option value="Citizen Group">Citizen Group / NGO</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="input-field-label">Short Summary (1-2 sentences for feed preview)</label>
            <textarea 
              rows="2" 
              required 
              placeholder="Concise overview of the challenge and target outcome..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-textarea"
            />
          </div>

          <div className="form-group">
            <label className="input-field-label">Detailed Description & Constraints</label>
            <textarea 
              rows="3" 
              placeholder="Background context, technical obstacles, preferred technologies, and evaluation criteria..."
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              className="text-textarea"
            />
          </div>

          <div className="form-group">
            <label className="input-field-label">Tags (comma separated)</label>
            <input 
              type="text" 
              placeholder="Smart Cities, IoT, GIS, Open Challenge"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="text-input"
            />
          </div>

          <button type="submit" className="form-submit-btn">
            <PlusCircle size={16} />
            <span>Publish Problem to First Look Platform</span>
          </button>
        </form>
      </div>
    </div>
  );
}
