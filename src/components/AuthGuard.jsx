import React from 'react';

export function AuthGuard({ expectedRole, currentAccount, children }) {
  const getRoleLabel = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'university': return 'University';
      case 'industry': return 'Industry';
      case 'citizen': return 'Citizen';
      default: return 'Portal';
    }
  };

  const portalLabel = getRoleLabel(expectedRole);

  // Case 1: Not authenticated at all
  if (!currentAccount) {
    return (
      <div className="auth-guard-container">
        <div className="auth-guard-card">
          <div className="auth-guard-icon-box lock-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <span className="auth-guard-pill">AUTHENTICATION REQUIRED</span>
          <h2 className="auth-guard-title">Sign In to Access {portalLabel} Portal</h2>
          <p className="auth-guard-text">
            This dashboard is protected. You must sign in or create an account to view community problems, submit proposals, or interact with solutions.
          </p>
          <div className="auth-guard-actions">
            <a 
              href={`/?auth=login&role=${expectedRole}`} 
              className="btn btn-blue auth-guard-btn"
              style={{ textDecoration: 'none' }}
            >
              Sign In / Sign Up →
            </a>
            <a 
              href="/" 
              className="btn btn-outline auth-guard-btn"
              style={{ textDecoration: 'none' }}
            >
              ← Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Logged in, but wrong role
  if (currentAccount.role !== expectedRole) {
    const userRoleLabel = getRoleLabel(currentAccount.role);
    return (
      <div className="auth-guard-container">
        <div className="auth-guard-card">
          <div className="auth-guard-icon-box warn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <span className="auth-guard-pill warn">RESTRICTED ACCESS</span>
          <h2 className="auth-guard-title">{portalLabel} Portal Is Restricted</h2>
          <p className="auth-guard-text">
            You are currently signed in as a <strong>{userRoleLabel}</strong> ({currentAccount.name}).
            This section is exclusively for <strong>{portalLabel}</strong> accounts.
          </p>
          <div className="auth-guard-actions">
            <a 
              href={`/${currentAccount.role}.html`} 
              className="btn btn-blue auth-guard-btn"
              style={{ textDecoration: 'none' }}
            >
              Go to My {userRoleLabel} Dashboard →
            </a>
            <button 
              type="button"
              className="btn btn-outline auth-guard-btn"
              onClick={() => {
                localStorage.removeItem('fl_active_account');
                window.location.href = `/?auth=login&role=${expectedRole}`;
              }}
            >
              Switch Account
            </button>
            <a 
              href="/" 
              className="btn btn-white auth-guard-btn"
              style={{ textDecoration: 'none' }}
            >
              ← Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Fully authenticated with matching role
  return children;
}
