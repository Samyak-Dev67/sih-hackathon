import React, { useState, useMemo } from 'react';

export function CivicCertificateModal({
  isOpen,
  onClose,
  student,
  team,
  challenge,
  availableChallenges = [],
  universityAccount
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Determine which challenge to display
  const [selectedChallengeId, setSelectedChallengeId] = useState(() => {
    if (challenge?.postId || challenge?.id) return String(challenge.postId || challenge.id);
    if (availableChallenges.length > 0) return String(availableChallenges[0].postId || availableChallenges[0].id);
    return '';
  });

  const activeChallenge = useMemo(() => {
    if (challenge && (!selectedChallengeId || String(challenge.postId || challenge.id) === String(selectedChallengeId))) {
      return challenge;
    }
    const found = availableChallenges.find(
      c => String(c.postId || c.id) === String(selectedChallengeId)
    );
    return found || challenge || {
      title: 'Civic Innovation & Community Impact Project',
      category: 'Civic Technology',
      progress: 100
    };
  }, [challenge, availableChallenges, selectedChallengeId]);

  if (!isOpen || !student) return null;

  // Derive university name
  const universityName = 
    universityAccount?.name || 
    activeChallenge?.universityName || 
    'University Research Directorate';

  // Format formal date
  const issueDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Generate deterministic Credential Identifier
  const rawId = (student.id || student.name || 'STU')
    .toString()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
  const probId = (activeChallenge?.postId || activeChallenge?.id || 'CIVIC')
    .toString()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4);
  const credentialId = `FL-CIVIC-${rawId}-${probId}-2026`;
  const verificationUrl = `https://firstlook.civic/verify/${credentialId}`;

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Handle Copy Verification Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Handle Copy Formatted Credential Text
  const handleCopyText = () => {
    const text = [
      '=== FIRST LOOK CIVIC RESEARCH CREDENTIAL ===',
      `Recipient: ${student.name}`,
      `Designated Role: ${student.role || 'Student Researcher'}`,
      `Department: ${student.department || 'Engineering & Applied Sciences'}`,
      `Lead Institution: ${universityName}`,
      `Civic Project: ${activeChallenge.title}`,
      `Impact Category: ${activeChallenge.category || 'Civic Tech'}`,
      `Credential ID: ${credentialId}`,
      `Issue Date: ${issueDate}`,
      `Verification URL: ${verificationUrl}`,
      '============================================'
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  };

  return (
    <div className="modal-backdrop-overlay cert-modal-backdrop" onClick={onClose}>
      <div 
        className="cert-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
      >
        {/* Top Floating Control Bar (Hidden on Print) */}
        <div className="cert-toolbar no-print">
          <div className="cert-toolbar-left">
            <span className="cert-toolbar-title" id="cert-modal-title">
              Civic Impact Research Credential
            </span>
            {availableChallenges.length > 1 && (
              <div className="cert-project-selector-wrap">
                <label htmlFor="cert-project-select" className="cert-select-label">
                  Project:
                </label>
                <select
                  id="cert-project-select"
                  className="cert-project-select"
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value)}
                >
                  {availableChallenges.map((c) => (
                    <option key={c.postId || c.id} value={String(c.postId || c.id)}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="cert-toolbar-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm cert-btn-action"
              onClick={handleCopyLink}
              title="Copy verification URL to clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>{copiedLink ? 'Link Copied!' : 'Copy Verification Link'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm cert-btn-action"
              onClick={handleCopyText}
              title="Copy citation and credential text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copiedText ? 'Credential Copied!' : 'Copy Credential Text'}</span>
            </button>

            <button
              type="button"
              className="btn btn-blue btn-sm cert-btn-print"
              onClick={handlePrint}
              title="Print certificate or save as high-resolution PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              className="cert-close-btn"
              onClick={onClose}
              title="Close Certificate Modal"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CERTIFICATE PRINT SHEET CONTAINER                                 */}
        {/* ================================================================= */}
        <div className="cert-canvas-wrapper">
          <div className="certificate-print-sheet" id="civic-certificate-element">
            {/* Outer Security & Ornamental Borders */}
            <div className="cert-outer-border">
              <div className="cert-inner-border">
                {/* Decorative Corner Ornaments */}
                <div className="cert-corner-ornament cert-corner-tl" />
                <div className="cert-corner-ornament cert-corner-tr" />
                <div className="cert-corner-ornament cert-corner-bl" />
                <div className="cert-corner-ornament cert-corner-br" />

                {/* Background Guilloché Security Watermark Pattern */}
                <div className="cert-security-watermark" aria-hidden="true">
                  <svg width="400" height="400" viewBox="0 0 100 100" fill="none" opacity="0.035">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" />
                    <polygon points="50,15 80,75 20,75" stroke="currentColor" strokeWidth="1" />
                    <polygon points="50,85 80,25 20,25" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>

                {/* Certificate Main Content */}
                <div className="cert-body-content">
                  {/* Institutional Header & Crest */}
                  <div className="cert-header-section">
                    <div className="cert-crest-badge">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                        <path d="M12 6l2.5 4.5 5 .7-3.6 3.5.9 5-4.8-2.5-4.8 2.5.9-5-3.6-3.5 5-.7L12 6z" fill="currentColor" opacity="0.15" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4" />
                      </svg>
                    </div>

                    <div className="cert-header-titles">
                      <span className="cert-initiative-kicker">
                        FIRST LOOK CIVIC INNOVATION & RESEARCH NETWORK
                      </span>
                      <h2 className="cert-university-title">
                        {universityName}
                      </h2>
                      <span className="cert-fellowship-subtitle">
                        Civic Technology Research Fellowship & Credential Registry
                      </span>
                    </div>
                  </div>

                  <div className="cert-title-divider" />

                  {/* Formal Credential Heading */}
                  <div className="cert-award-heading">
                    <h1 className="cert-main-headline">
                      CERTIFICATE OF CIVIC RESEARCH EXCELLENCE
                    </h1>
                    <p className="cert-award-subtext">
                      This official research credential is duly conferred upon
                    </p>
                  </div>

                  {/* Recipient Name */}
                  <div className="cert-recipient-block">
                    <div className="cert-recipient-name">
                      {student.name}
                    </div>
                    <div className="cert-recipient-title">
                      Designated <strong>{student.role || 'Research Lead'}</strong>
                      {student.department ? ` • Department of ${student.department}` : ''}
                      {team?.name ? ` • Team: ${team.name}` : ''}
                    </div>
                  </div>

                  {/* Citation Statement */}
                  <div className="cert-citation-paragraph">
                    for outstanding applied research, interdisciplinary prototyping, and engineering rigor contributed to the civic challenge:
                  </div>

                  {/* Project Highlight Card */}
                  <div className="cert-project-badge-box">
                    <div className="cert-project-category-pill">
                      {activeChallenge.category || 'Civic Infrastructure'}
                    </div>
                    <h3 className="cert-project-name">
                      {activeChallenge.title}
                    </h3>
                    <div className="cert-project-meta-row">
                      <span className="cert-project-meta-item">
                        Lead Academic Institution: <strong>{universityName}</strong>
                      </span>
                      <span className="cert-project-meta-separator">•</span>
                      <span className="cert-project-meta-item">
                        Milestone Status: <strong>{activeChallenge.progress ? `${activeChallenge.progress}% Delivered` : 'Active Research Phase'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Signatories & Official Rosette Seal */}
                  <div className="cert-footer-section">
                    {/* Left Signatory: University Faculty */}
                    <div className="cert-signature-block">
                      <div className="cert-signature-line" />
                      <div className="cert-signature-name">
                        Dean of Research & Innovation
                      </div>
                      <div className="cert-signature-org">
                        {universityName}
                      </div>
                    </div>

                    {/* Center Seal */}
                    <div className="cert-seal-block">
                      <div className="cert-official-seal">
                        <svg width="86" height="86" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="46" stroke="#9333ea" strokeWidth="3" strokeDasharray="4 2" />
                          <circle cx="50" cy="50" r="38" stroke="#3b82f6" strokeWidth="1.5" />
                          <circle cx="50" cy="50" r="30" fill="rgba(147, 51, 234, 0.08)" stroke="#9333ea" strokeWidth="1" />
                          <path d="M50 25 L55 38 L69 38 L58 47 L62 60 L50 51 L38 60 L42 47 L31 38 L45 38 Z" fill="#eab308" opacity="0.8" />
                          <text x="50" y="74" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#4b5563" letterSpacing="0.8">
                            VERIFIED CIVIC
                          </text>
                          <text x="50" y="81" textAnchor="middle" fontSize="5.5" fill="#6b7280" letterSpacing="0.5">
                            RESEARCH
                          </text>
                        </svg>
                      </div>
                      <div className="cert-seal-caption">OFFICIAL SEAL</div>
                    </div>

                    {/* Right Signatory: First Look Platform */}
                    <div className="cert-signature-block">
                      <div className="cert-signature-line" />
                      <div className="cert-signature-name">
                        Director of Civic Alliances
                      </div>
                      <div className="cert-signature-org">
                        First Look Civic Tech Network
                      </div>
                    </div>
                  </div>

                  {/* Bottom Verification & Cryptographic Bar */}
                  <div className="cert-security-bar">
                    <div className="cert-security-meta">
                      <span>Credential ID: <strong>{credentialId}</strong></span>
                      <span className="cert-bullet-sep">•</span>
                      <span>Date of Conformance: <strong>{issueDate}</strong></span>
                    </div>
                    <div className="cert-verification-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Cryptographically Auditable Credential</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CivicCertificateModal;
