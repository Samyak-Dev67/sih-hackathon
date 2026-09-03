import React, { useState } from 'react';
import { X, GraduationCap, Users, Building2, AlertCircle, CheckCircle, ArrowRight, Lock, Mail, User, MapPin } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { DEMO_PROFILES } from '../data/mockData';

export function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen', 'university', 'industry'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationOrInst, setOrganizationOrInst] = useState('');
  const [academicOrIndustryType, setAcademicOrIndustryType] = useState('Student');
  const [locationOrCity, setLocationOrCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  // Real Supabase Authentication Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              first_name: fullName.trim() || email.split('@')[0],
              role: selectedRole,
              organization: organizationOrInst,
              affiliation_type: academicOrIndustryType,
              location: locationOrCity,
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          if (data.session) {
            setInfoMessage('Account successfully created! Logging you into your ecosystem portal...');
            setTimeout(() => {
              onAuthSuccess({
                id: data.user.id,
                email: data.user.email,
                name: fullName || data.user.email.split('@')[0],
                role: selectedRole,
                organization: organizationOrInst
              });
              onClose();
            }, 800);
          } else {
            setInfoMessage('Account registered in Supabase! Accessing your portal for hackathon evaluation...');
            setTimeout(() => {
              onAuthSuccess({
                id: data.user.id,
                email: data.user.email,
                name: fullName || data.user.email.split('@')[0],
                role: selectedRole,
                organization: organizationOrInst
              });
              onClose();
            }, 1000);
          }
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          const userMeta = data.user.user_metadata || {};
          const detectedRole = userMeta.role || selectedRole;
          
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: userMeta.first_name || data.user.email.split('@')[0],
            role: detectedRole,
            organization: userMeta.organization || ''
          });
          onClose();
        }
      }
    } catch (err) {
      console.warn('Supabase auth response:', err.message);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials or use the instant Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = (role) => {
    const profile = DEMO_PROFILES[role];
    onAuthSuccess(profile);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="auth-header-container">
          <div className="auth-brand-pill">
            <div className="auth-logo-badge">FL</div>
            <span className="auth-platform-name">First Look Platform</span>
          </div>

          <h2 className="auth-headline">
            {authMode === 'signup' ? 'Join the Multi-Sector Network' : 'Sign in to First Look'}
          </h2>
          <p className="auth-subtext">
            Connecting Citizens, Universities, and Industries to solve national & local challenges.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-mode-tabs">
          <button 
            type="button"
            className={`auth-mode-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setErrorMessage(''); setInfoMessage(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-mode-btn ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => { setAuthMode('signup'); setErrorMessage(''); setInfoMessage(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Sector Role Selection */}
        <div className="role-selection-section">
          <label className="input-field-label">Select Your Ecosystem Role</label>
          <div className="role-cards-selector">
            <div 
              className={`role-option-card citizen ${selectedRole === 'citizen' ? 'active' : ''}`}
              onClick={() => setSelectedRole('citizen')}
            >
              <div className="role-card-icon-circle">
                <Users size={18} />
              </div>
              <div className="role-card-text">
                <strong>Citizen</strong>
                <span>Community & Civic Voice</span>
              </div>
            </div>

            <div 
              className={`role-option-card university ${selectedRole === 'university' ? 'active' : ''}`}
              onClick={() => setSelectedRole('university')}
            >
              <div className="role-card-icon-circle">
                <GraduationCap size={18} />
              </div>
              <div className="role-card-text">
                <strong>University</strong>
                <span>Research, Faculty & Students</span>
              </div>
            </div>

            <div 
              className={`role-option-card industry ${selectedRole === 'industry' ? 'active' : ''}`}
              onClick={() => setSelectedRole('industry')}
            >
              <div className="role-card-icon-circle">
                <Building2 size={18} />
              </div>
              <div className="role-card-text">
                <strong>Industry</strong>
                <span>Enterprises, Grants & Challenges</span>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="auth-info-banner">
            <CheckCircle size={16} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="auth-form-fields">
          {authMode === 'signup' && (
            <>
              <div className="form-group">
                <label className="input-field-label">Full Name / Representative Name</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-input"
                  />
                </div>
              </div>

              {selectedRole === 'university' && (
                <>
                  <div className="form-group">
                    <label className="input-field-label">University / Institute Name</label>
                    <div className="input-with-icon">
                      <GraduationCap size={16} className="field-icon" />
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. National Institute of Technology"
                        value={organizationOrInst}
                        onChange={(e) => setOrganizationOrInst(e.target.value)}
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-field-label">Academic Affiliation</label>
                    <select 
                      value={academicOrIndustryType} 
                      onChange={(e) => setAcademicOrIndustryType(e.target.value)}
                      className="text-select"
                    >
                      <option value="Student">Undergraduate / Graduate Student</option>
                      <option value="Faculty">Professor / Faculty Lead</option>
                      <option value="Researcher">Postdoc / Research Fellow</option>
                      <option value="Lab">Research Lab Coordinator</option>
                    </select>
                  </div>
                </>
              )}

              {selectedRole === 'industry' && (
                <>
                  <div className="form-group">
                    <label className="input-field-label">Company / Organization Name</label>
                    <div className="input-with-icon">
                      <Building2 size={16} className="field-icon" />
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Apex CleanTech Systems"
                        value={organizationOrInst}
                        onChange={(e) => setOrganizationOrInst(e.target.value)}
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-field-label">Industry Domain / Sector</label>
                    <select 
                      value={academicOrIndustryType} 
                      onChange={(e) => setAcademicOrIndustryType(e.target.value)}
                      className="text-select"
                    >
                      <option value="Infrastructure & Smart Cities">Infrastructure & Smart Cities</option>
                      <option value="CleanTech & Energy">CleanTech & Energy</option>
                      <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                      <option value="Agriculture & FoodTech">Agriculture & FoodTech</option>
                      <option value="DeepTech & AI">DeepTech & AI</option>
                    </select>
                  </div>
                </>
              )}

              {selectedRole === 'citizen' && (
                <div className="form-group">
                  <label className="input-field-label">City or District</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="field-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Indiranagar, Bengaluru"
                      value={locationOrCity}
                      onChange={(e) => setLocationOrCity(e.target.value)}
                      className="text-input"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="input-field-label">
              {selectedRole === 'university' ? 'Academic (.edu) Email Address' : selectedRole === 'industry' ? 'Corporate Email Address' : 'Email Address'}
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input 
                type="email" 
                required 
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-field-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input 
                type="password" 
                required 
                placeholder="Your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating with Supabase...</span>
            ) : (
              <>
                <span>{authMode === 'signup' ? `Sign Up as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : `Log In to ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal`}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Instant Demo Role Login */}
        <div className="demo-evaluator-section">
          <div className="demo-divider">
            <span>Instant Demo Access (No Email Verification Needed)</span>
          </div>

          <div className="demo-shortcuts-grid">
            <button 
              type="button" 
              className="demo-shortcut-btn citizen"
              onClick={() => handleInstantDemoLogin('citizen')}
            >
              <Users size={14} />
              <span>Demo Citizen</span>
            </button>

            <button 
              type="button" 
              className="demo-shortcut-btn university"
              onClick={() => handleInstantDemoLogin('university')}
            >
              <GraduationCap size={14} />
              <span>Demo University</span>
            </button>

            <button 
              type="button" 
              className="demo-shortcut-btn industry"
              onClick={() => handleInstantDemoLogin('industry')}
            >
              <Building2 size={14} />
              <span>Demo Industry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
