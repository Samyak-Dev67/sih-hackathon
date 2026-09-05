import React, { useState, useEffect } from 'react';
import {
  fetchUniversityTeams,
  getAcceptedChallenges,
  addUniversityStudent,
  updateUniversityStudent,
  deleteUniversityStudent,
  createUniversityTeam,
  updateUniversityTeam,
  deleteUniversityTeam,
  toggleTeamProblemAssignment
} from '../services/api';

const SUGGESTED_ROLES = [
  'Research Lead',
  'Embedded Systems Lead',
  'Water Quality Analyst',
  'IoT Firmware Developer',
  'GIS & Spatial Mapping Specialist',
  'Data Scientist',
  'Mechanical Design Specialist',
  'Field Testing Lead'
];

export function TeamManagement({
  currentAccount,
  acceptedProblems = [],
  onOpenWorkspace,
  onNavigateToDiscover
}) {
  const universityId = currentAccount?.id;
  const [subTab, setSubTab] = useState('teams'); // 'teams' | 'students'
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState(() => getAcceptedChallenges(universityId));
  const [activePickerTeamId, setActivePickerTeamId] = useState(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filters
  const [teamSearch, setTeamSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Modals state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null); // null for create, team obj for edit
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    department: '',
    description: '',
    studentIds: [],
    assignedProblemIds: []
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    teamIds: []
  });

  const [assigningTeam, setAssigningTeam] = useState(null); // team obj for quick problem assignment modal

  // Load data directly from Supabase backend
  const reloadData = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const fetchedTeams = await fetchUniversityTeams(universityId);
      setTeams(fetchedTeams || []);

      // Derive distinct students list from members JSON across this university's teams only
      const allMembers = [];
      const seenIds = new Set();
      (fetchedTeams || []).forEach(team => {
        (team.members || []).forEach(m => {
          if (m && (m.id || m.email || m.name)) {
            if (universityId && m.university_id && String(m.university_id) !== String(universityId)) {
              return;
            }
            if (universityId && m.universityId && String(m.universityId) !== String(universityId)) {
              return;
            }
            const key = m.id || m.email || m.name;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              allMembers.push(m);
            }
          }
        });
      });
      setStudents(allMembers);
    } catch (err) {
      console.error('Error communicating with Supabase backend:', err);
      setBackendError(err.message || 'Failed to communicate with Supabase backend.');
    } finally {
      setLoading(false);
      setAcceptedChallenges(getAcceptedChallenges(universityId));
    }
  };

  const availableAcceptedChallenges = acceptedChallenges;

  useEffect(() => {
    reloadData();
  }, [universityId]);

  // Compute metrics
  const totalTeams = teams.length;
  const totalStudents = students.length;
  const uniqueAssignedProblemIds = new Set(teams.flatMap(t => t.assignedProblemIds || t.associated_to || []));
  const assignedProblemsCount = uniqueAssignedProblemIds.size;

  // Filtered teams
  const filteredTeams = teams.filter(t => {
    if (!teamSearch.trim()) return true;
    const q = teamSearch.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // Team Modal Handlers
  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
    setModalError(null);
    setTeamFormData({
      name: '',
      department: '',
      description: '',
      studentIds: [],
      assignedProblemIds: []
    });
    setShowTeamModal(true);
  };

  const handleOpenEditTeam = (team) => {
    setEditingTeam(team);
    setModalError(null);
    const existingStudentIds = Array.isArray(team.members)
      ? team.members.map(m => m.id || m.email || m.name)
      : (team.studentIds || []);

    const existingProblemIds = Array.isArray(team.associated_to)
      ? team.associated_to
      : (team.assignedProblemIds || []);

    setTeamFormData({
      name: team.name || '',
      department: team.department || '',
      description: team.description || '',
      studentIds: [...existingStudentIds],
      assignedProblemIds: [...existingProblemIds]
    });
    setShowTeamModal(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamFormData.name.trim()) {
      setModalError('Please enter a valid team name.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      // Build members list from selected student IDs
      const selectedMembers = students.filter(s =>
        teamFormData.studentIds.includes(s.id || s.email || s.name)
      );

      const payload = {
        name: teamFormData.name.trim(),
        description: teamFormData.description?.trim() || '',
        department: teamFormData.department?.trim() || 'General Engineering',
        associated_to: teamFormData.assignedProblemIds.map(String),
        members: selectedMembers,
        universityName: currentAccount?.name || 'University Laboratory'
      };

      if (editingTeam) {
        await updateUniversityTeam(universityId, editingTeam.id, payload);
      } else {
        await createUniversityTeam(universityId, payload);
      }

      await reloadData();
      setShowTeamModal(false);
    } catch (err) {
      console.error('Failed to save team to Supabase:', err);
      setModalError(err.message || 'Failed to save team to backend.');
      setBackendError(err.message || 'Failed to save team to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (window.confirm(`Are you sure you want to delete team "${teamName}" from Supabase?`)) {
      try {
        await deleteUniversityTeam(universityId, teamId);
        await reloadData();
      } catch (err) {
        console.error('Failed to delete team:', err);
        setBackendError(err.message || 'Failed to delete team from backend.');
      }
    }
  };

  // Student Modal Handlers
  const handleOpenAddStudent = (preselectedTeamId = null) => {
    setEditingStudent(null);
    setModalError(null);
    const initialTeamIds = preselectedTeamId
      ? [preselectedTeamId]
      : (teams.length > 0 ? [teams[0].id] : []);

    setStudentFormData({
      name: '',
      role: '',
      department: '',
      email: '',
      teamIds: initialTeamIds
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setModalError(null);
    const memberOfTeams = teams
      .filter(t => (t.members || []).some(m => String(m.id) === String(student.id)))
      .map(t => t.id);

    setStudentFormData({
      name: student.name || '',
      role: student.role || '',
      department: student.department || '',
      email: student.email || '',
      teamIds: memberOfTeams
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentFormData.name.trim()) {
      setModalError('Please enter the student\'s full name.');
      return;
    }

    if (teams.length === 0) {
      setModalError('No research teams exist in Supabase yet. Please create a team first before enrolling student members.');
      return;
    }

    if (!studentFormData.teamIds || studentFormData.teamIds.length === 0) {
      setModalError('Please select at least one team to assign this student researcher to.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingStudent) {
        await updateUniversityStudent(universityId, editingStudent.id, studentFormData);
      } else {
        await addUniversityStudent(universityId, studentFormData);
      }
      await reloadData();
      setShowStudentModal(false);
    } catch (err) {
      console.error('Failed to save student member to Supabase:', err);
      setModalError(err.message || 'Failed to save student member to backend.');
      setBackendError(err.message || 'Failed to save student member to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`Remove ${studentName} from all research teams in Supabase?`)) {
      try {
        await deleteUniversityStudent(universityId, studentId);
        await reloadData();
      } catch (err) {
        console.error('Failed to delete student:', err);
        setBackendError(err.message || 'Failed to delete student from backend.');
      }
    }
  };

  // Quick Problem Assignment Modal Handlers
  const handleToggleProblem = async (teamId, postId) => {
    try {
      await toggleTeamProblemAssignment(universityId, teamId, postId);
      await reloadData();
      if (assigningTeam && String(assigningTeam.id) === String(teamId)) {
        setAssigningTeam(prev => {
          if (!prev) return null;
          const current = prev.assignedProblemIds || prev.associated_to || [];
          const postStr = String(postId);
          const next = current.includes(postStr)
            ? current.filter(id => id !== postStr)
            : [...current, postStr];
          return { ...prev, assignedProblemIds: next, associated_to: next };
        });
      }
    } catch (err) {
      console.error('Failed to update problem assignment in Supabase:', err);
      setBackendError(err.message || 'Failed to update problem assignment in backend.');
    }
  };

  return (
    <div className="uni-team-management-dashboard">
      {/* Backend Communication Error Banner */}
      {backendError && (
        <div className="backend-error-banner" role="alert">
          <div className="backend-error-header">
            <div className="backend-error-badge-row">
              <span className="backend-error-pill">DATABASE COMMUNICATION ERROR</span>
              <span className="backend-error-title">Supabase Backend Failure</span>
            </div>
            <button
              type="button"
              className="backend-error-dismiss"
              onClick={() => setBackendError(null)}
              title="Dismiss error alert"
            >
              ✕
            </button>
          </div>
          <p className="backend-error-message">{backendError}</p>
          {backendError.includes('42501') && (
            <div className="backend-error-help">
              <strong>Row Level Security (RLS) Policy Required:</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
                RLS is enabled on the <code>teams</code> table, but no policy allows access. In your Supabase dashboard, go to <strong>Authentication &gt; Policies &gt; teams</strong> and add policies granting access for <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code>.
              </p>
            </div>
          )}
          {backendError.includes('42P01') && (
            <div className="backend-error-help">
              <strong>Missing Table:</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
                The table <code>teams</code> was not found in your Supabase database. Please create the table in Supabase Table Editor.
              </p>
            </div>
          )}
          <div className="backend-error-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                setBackendError(null);
                reloadData();
              }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="uni-workspace-header-row">
        <div>
          <h1 className="uni-workspace-title">
            Team Management: {currentAccount?.name || 'University Laboratory'}
          </h1>
          <p className="uni-workspace-subtitle">
            Assemble student research teams, designate specific roles, and assign teams to challenges accepted by {currentAccount?.name || 'your university'}.
          </p>
        </div>
        <div className="uni-team-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleOpenAddStudent()}
          >
            + Add Student
          </button>
          <button
            type="button"
            className="btn btn-blue"
            onClick={handleOpenCreateTeam}
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="uni-metrics-grid">
        <div className="uni-metric-card">
          <span className="uni-metric-label">RESEARCH TEAMS</span>
          <span className="uni-metric-value text-blue">{loading ? '—' : totalTeams}</span>
        </div>

        <div className="uni-metric-card">
          <span className="uni-metric-label">STUDENT RESEARCHERS</span>
          <span className="uni-metric-value text-orange">{loading ? '—' : totalStudents}</span>
        </div>

        <div className="uni-metric-card">
          <span className="uni-metric-label">CHALLENGES COVERED</span>
          <span className="uni-metric-value text-green">{loading ? '—' : assignedProblemsCount}</span>
        </div>
      </div>

      {/* Subnav Toggle: Teams vs Students Directory */}
      <div className="uni-team-subnav">
        <button
          type="button"
          className={`uni-team-subnav-btn ${subTab === 'teams' ? 'active' : ''}`}
          onClick={() => setSubTab('teams')}
        >
          Research Teams ({loading ? '...' : teams.length})
        </button>
        <button
          type="button"
          className={`uni-team-subnav-btn ${subTab === 'students' ? 'active' : ''}`}
          onClick={() => setSubTab('students')}
        >
          Student Directory ({loading ? '...' : students.length})
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="team-loading-state">
          <div className="team-loading-spinner" />
          <span>Synchronizing teams with Supabase database...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: RESEARCH TEAMS                                                   */}
      {/* ========================================================================= */}
      {subTab === 'teams' && (
        <div className="uni-teams-view">
          <div className="team-filter-bar">
            <input
              type="text"
              placeholder="Search teams by name, department, or focus..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="feed-search-input team-search-field"
            />
            {teamSearch && (
              <button
                type="button"
                className="feed-search-clear-btn"
                onClick={() => setTeamSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          {filteredTeams.length === 0 ? (
            <div className="empty-accepted-box">
              <h3>No Research Teams Found</h3>
              <p>
                {teamSearch
                  ? `No teams match query "${teamSearch}".`
                  : 'Start by creating your first student research team to work on civic challenges.'}
              </p>
              <button
                type="button"
                className="btn btn-blue"
                style={{ marginTop: '0.75rem' }}
                onClick={handleOpenCreateTeam}
              >
                + Create Research Team
              </button>
            </div>
          ) : (
            <div className="teams-grid-container">
              {filteredTeams.map((team) => {
                const teamMembers = Array.isArray(team.members) ? team.members : [];
                const teamProblemIds = Array.isArray(team.associated_to)
                  ? team.associated_to
                  : (team.assignedProblemIds || []);
                const assignedChallenges = availableAcceptedChallenges.filter(p =>
                  teamProblemIds.some(id => String(id) === String(p.postId))
                );

                return (
                  <div key={team.id} className="team-card-container">
                    {/* Team Top Header */}
                    <div className="team-card-header">
                      <div>
                        <div className="team-department-pill">{team.department || 'Multidisciplinary Team'}</div>
                        <h3 className="team-card-title">{team.name}</h3>
                      </div>
                      <div className="team-card-actions">
                        <button
                          type="button"
                          className="team-icon-btn"
                          title="Edit Team"
                          onClick={() => handleOpenEditTeam(team)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="team-icon-btn text-danger"
                          title="Delete Team"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Team Description */}
                    {team.description && (
                      <p className="team-card-desc">{team.description}</p>
                    )}

                    {/* Multi-Problem Section: A single team can work on multiple problems */}
                    <div className="team-section-divider" />
                    <div className="team-problems-block">
                      <div className="team-section-header-row">
                        <span className="team-section-subheading">
                          Assigned Challenges ({assignedChallenges.length})
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-link-action"
                            onClick={() => setActivePickerTeamId(activePickerTeamId === team.id ? null : team.id)}
                          >
                            {activePickerTeamId === team.id ? 'Close Options ✕' : '+ Add Problems'}
                          </button>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <button
                            type="button"
                            className="btn-link-action"
                            onClick={() => setAssigningTeam(team)}
                          >
                            Manage All →
                          </button>
                        </div>
                      </div>

                      {assignedChallenges.length === 0 ? (
                        <div className="team-no-problems-notice">
                          <span>Not assigned to any challenges yet.</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setActivePickerTeamId(activePickerTeamId === team.id ? null : team.id)}
                            style={{ marginTop: '0.4rem' }}
                          >
                            {activePickerTeamId === team.id ? 'Close Problem Options' : '+ Add Problems from Accepted'}
                          </button>
                        </div>
                      ) : (
                        <div className="team-assigned-problems-list">
                          {assignedChallenges.map((challenge) => (
                            <div key={challenge.id} className="team-problem-badge-row">
                              <div className="team-problem-info">
                                <span className="tag-pill category-tag-xs">{challenge.category}</span>
                                <span className="team-problem-title-text">{challenge.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  className="btn-table-workspace"
                                  onClick={() => onOpenWorkspace && onOpenWorkspace(challenge.postId)}
                                >
                                  Workspace →
                                </button>
                                <button
                                  type="button"
                                  className="btn-unassign-chip"
                                  title="Unassign problem from this team"
                                  onClick={() => handleToggleProblem(team.id, challenge.postId)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setActivePickerTeamId(activePickerTeamId === team.id ? null : team.id)}
                            >
                              {activePickerTeamId === team.id ? 'Close Problem Options' : '+ Add More Problems'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* INLINE PROBLEM OPTIONS PICKER: Displays options from which problems the university accepted */}
                      {activePickerTeamId === team.id && (
                        <div className="inline-problem-picker-card">
                          <div className="picker-header-row">
                            <span className="picker-header-label">
                              Options from Accepted Challenges ({availableAcceptedChallenges.length}):
                            </span>
                            <button
                              type="button"
                              className="picker-close-btn"
                              onClick={() => setActivePickerTeamId(null)}
                            >
                              ✕
                            </button>
                          </div>

                          {availableAcceptedChallenges.length === 0 ? (
                            <div className="picker-empty-hint">
                              <p style={{ margin: 0, fontWeight: 600 }}>No civic problems accepted yet.</p>
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                First accept challenges from "Discover Open Problems" to assign them to your teams.
                              </span>
                              {onNavigateToDiscover && (
                                <button
                                  type="button"
                                  className="btn btn-blue btn-sm"
                                  style={{ marginTop: '0.5rem' }}
                                  onClick={onNavigateToDiscover}
                                >
                                  Browse Open Problems →
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="picker-options-grid">
                              {availableAcceptedChallenges.map((prob) => {
                                const isAssigned = (team.assignedProblemIds || []).some(
                                  id => String(id) === String(prob.postId)
                                );
                                return (
                                  <div
                                    key={prob.id}
                                    className={`picker-option-tile ${isAssigned ? 'is-assigned' : ''}`}
                                    onClick={() => handleToggleProblem(team.id, prob.postId)}
                                  >
                                    <div className="picker-option-check">
                                      <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={() => {}}
                                      />
                                    </div>
                                    <div className="picker-option-info">
                                      <span className="tag-pill category-tag-xs">{prob.category}</span>
                                      <span className="picker-option-title">{prob.title}</span>
                                    </div>
                                    <span className={`picker-badge-status ${isAssigned ? 'assigned' : 'unassigned'}`}>
                                      {isAssigned ? 'Assigned' : '+ Assign'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team Members Roster */}
                    <div className="team-section-divider" />
                    <div className="team-members-block">
                      <div className="team-section-header-row">
                        <span className="team-section-subheading">
                          Team Members ({teamMembers.length})
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-link-action"
                            onClick={() => handleOpenAddStudent(team.id)}
                          >
                            + Add Student
                          </button>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <button
                            type="button"
                            className="btn-link-action"
                            onClick={() => handleOpenEditTeam(team)}
                          >
                            Edit Roster
                          </button>
                        </div>
                      </div>

                      {teamMembers.length === 0 ? (
                        <div className="team-no-members-notice">
                          <span>No students assigned to this team yet.</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenAddStudent(team.id)}
                            style={{ marginTop: '0.4rem' }}
                          >
                            + Add Student Member
                          </button>
                        </div>
                      ) : (
                        <div className="team-students-list">
                          {teamMembers.map((stu) => (
                            <div key={stu.id || stu.name} className="team-student-chip">
                              <div className="student-avatar-badge">{stu.initials || 'ST'}</div>
                              <div className="student-chip-details">
                                <span className="student-chip-name">{stu.name}</span>
                                <span className="student-chip-role">{stu.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: STUDENT DIRECTORY                                                 */}
      {/* ========================================================================= */}
      {subTab === 'students' && (
        <div className="uni-students-view">
          <div className="directory-filter-row">
            <div className="team-filter-bar">
              <input
                type="text"
                placeholder="Search students by name, role, department, or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="feed-search-input team-search-field"
              />
              {studentSearch && (
                <button
                  type="button"
                  className="feed-search-clear-btn"
                  onClick={() => setStudentSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn btn-blue"
              onClick={() => handleOpenAddStudent()}
            >
              + Add Student Researcher
            </button>
          </div>

          <div className="students-directory-card">
            {filteredStudents.length === 0 ? (
              <div className="empty-accepted-box">
                <h3>No Students Found</h3>
                <p>
                  {studentSearch
                    ? `No students match search "${studentSearch}".`
                    : 'Add student researchers to your university roster to build multidisciplinary project teams.'}
                </p>
                <button
                  type="button"
                  className="btn btn-blue"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => handleOpenAddStudent()}
                >
                  + Add Student Researcher
                </button>
              </div>
            ) : (
              <div className="students-table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Designated Role</th>
                      <th>Department</th>
                      <th>Email / ID</th>
                      <th>Assigned Teams</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const studentTeams = teams.filter(t =>
                        (t.members || []).some(m => String(m.id || m.name) === String(student.id || student.name))
                      );
                      return (
                        <tr key={student.id || student.email || student.name}>
                          <td>
                            <div className="student-table-name-cell">
                              <div className="student-avatar-badge">{student.initials || 'ST'}</div>
                              <span className="student-table-name">{student.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="student-role-pill">{student.role}</span>
                          </td>
                          <td>
                            <span className="text-muted">{student.department || 'Engineering'}</span>
                          </td>
                          <td>
                            <span className="text-muted">{student.email || '—'}</span>
                          </td>
                          <td>
                            <div className="student-teams-cell-badges">
                              {studentTeams.length === 0 ? (
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Unassigned</span>
                              ) : (
                                studentTeams.map(t => (
                                  <span key={t.id} className="student-team-membership-pill">
                                    {t.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions-group">
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => handleOpenEditStudent(student)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-table-action text-danger"
                                onClick={() => handleDeleteStudent(student.id, student.name)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT TEAM                                              */}
      {/* ========================================================================= */}
      {showTeamModal && (
        <div className="modal-backdrop-overlay" onClick={() => !isSubmitting && setShowTeamModal(false)}>
          <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="modal-heading-title">
                  {editingTeam ? 'Edit Research Team' : 'Create New Research Team'}
                </h2>
                <p className="modal-subheading-text">
                  Configure team details, members, and accepted problem assignments in Supabase.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => !isSubmitting && setShowTeamModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Error Alert */}
            {modalError && (
              <div className="modal-error-banner" role="alert">
                <span className="modal-error-title">Backend Error:</span> {modalError}
              </div>
            )}

            <form onSubmit={handleSaveTeam} className="team-modal-form">
              <div className="form-group-item">
                <label className="form-item-label">Team Name *</label>
                <input
                  type="text"
                  className="form-input-field"
                  placeholder="e.g., AquaPure Filtration Cohort"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group-item">
                <label className="form-item-label">Department / Discipline</label>
                <input
                  type="text"
                  className="form-input-field"
                  placeholder="e.g., Department of Environmental & Sensor Engineering"
                  value={teamFormData.department}
                  onChange={(e) => setTeamFormData({ ...teamFormData, department: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group-item">
                <label className="form-item-label">Research Focus / Objective</label>
                <textarea
                  className="form-textarea-field"
                  rows={2}
                  placeholder="Brief summary of what this team is specialized in..."
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Assign Students: Multi-student selection */}
              <div className="form-group-item">
                <label className="form-item-label">
                  Assign Student Researchers ({teamFormData.studentIds.length} selected)
                </label>
                <p className="form-help-hint">Select enrolled students to include in this team's roster.</p>
                {students.length === 0 ? (
                  <div className="form-empty-hint">
                    No student researchers enrolled yet. You can create the team now and add students later.
                  </div>
                ) : (
                  <div className="team-multiselect-box">
                    {students.map((stu) => {
                      const stuKey = stu.id || stu.email || stu.name;
                      const isChecked = teamFormData.studentIds.includes(stuKey);
                      return (
                        <label key={stuKey} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTeamFormData({
                                  ...teamFormData,
                                  studentIds: [...teamFormData.studentIds, stuKey]
                                });
                              } else {
                                setTeamFormData({
                                  ...teamFormData,
                                  studentIds: teamFormData.studentIds.filter(id => id !== stuKey)
                                });
                              }
                            }}
                          />
                          <div className="multiselect-label-content">
                            <span className="multiselect-primary-name">{stu.name}</span>
                            <span className="multiselect-sub-badge">{stu.role}</span>
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>{stu.department}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assign Problems: Multi-problem selection */}
              <div className="form-group-item">
                <label className="form-item-label">
                  Assign to Accepted Challenges ({teamFormData.assignedProblemIds.length} assigned)
                </label>
                <p className="form-help-hint">
                  A single team can work on multiple civic problems accepted by your university.
                </p>
                {availableAcceptedChallenges.length === 0 ? (
                  <div className="form-empty-hint">
                    No accepted challenges yet. Accept problems from Discover Open Problems to assign them to this team.
                  </div>
                ) : (
                  <div className="team-multiselect-box">
                    {availableAcceptedChallenges.map((prob) => {
                      const isChecked = teamFormData.assignedProblemIds.some(id => String(id) === String(prob.postId));
                      return (
                        <label key={prob.id} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTeamFormData({
                                  ...teamFormData,
                                  assignedProblemIds: [...teamFormData.assignedProblemIds, prob.postId]
                                });
                              } else {
                                setTeamFormData({
                                  ...teamFormData,
                                  assignedProblemIds: teamFormData.assignedProblemIds.filter(
                                    id => String(id) !== String(prob.postId)
                                  )
                                });
                              }
                            }}
                          />
                          <div className="multiselect-label-content">
                            <span className="tag-pill category-tag-xs">{prob.category}</span>
                            <span className="multiselect-primary-name">{prob.title}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-form-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowTeamModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving to Supabase...'
                    : (editingTeam ? 'Update Team' : 'Create Team in Database')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT STUDENT RESEARCHER                                   */}
      {/* ========================================================================= */}
      {showStudentModal && (
        <div className="modal-backdrop-overlay" onClick={() => !isSubmitting && setShowStudentModal(false)}>
          <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="modal-heading-title">
                  {editingStudent ? 'Edit Student Researcher' : 'Add Student Researcher'}
                </h2>
                <p className="modal-subheading-text">
                  Enroll student talent with designated research engineering roles into your teams.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => !isSubmitting && setShowStudentModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Error Alert */}
            {modalError && (
              <div className="modal-error-banner" role="alert">
                <span className="modal-error-title">Backend Error:</span> {modalError}
              </div>
            )}

            {teams.length === 0 ? (
              <div className="form-empty-hint" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Create a Team First</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Student researchers must be enrolled into a research team in Supabase. Please create your first research team before adding students.
                </p>
                <button
                  type="button"
                  className="btn btn-blue"
                  onClick={() => {
                    setShowStudentModal(false);
                    handleOpenCreateTeam();
                  }}
                >
                  + Create Research Team First
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveStudent} className="team-modal-form">
                <div className="form-group-item">
                  <label className="form-item-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="e.g., Aarav Deshmukh"
                    value={studentFormData.name}
                    onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-item-label">Designated Role *</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="e.g., Embedded Systems Lead"
                    value={studentFormData.role}
                    onChange={(e) => setStudentFormData({ ...studentFormData, role: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                  <div className="suggested-roles-chips">
                    <span className="suggested-roles-label">Quick Suggestions:</span>
                    {SUGGESTED_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className="suggested-role-chip"
                        onClick={() => setStudentFormData({ ...studentFormData, role })}
                        disabled={isSubmitting}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-item-label">Department / Branch</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="e.g., Electrical Engineering"
                    value={studentFormData.department}
                    onChange={(e) => setStudentFormData({ ...studentFormData, department: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-item-label">Institutional Email / Roll No.</label>
                  <input
                    type="email"
                    className="form-input-field"
                    placeholder="e.g., student.name@univ.edu.in"
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Team Assignment Checkboxes */}
                <div className="form-group-item">
                  <label className="form-item-label">Assign to Research Teams *</label>
                  <p className="form-help-hint">
                    Select which research team(s) this student researcher will join.
                  </p>
                  <div className="team-multiselect-box">
                    {teams.map((t) => {
                      const isChecked = studentFormData.teamIds.includes(t.id);
                      return (
                        <label key={t.id} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStudentFormData({
                                  ...studentFormData,
                                  teamIds: [...studentFormData.teamIds, t.id]
                                });
                              } else {
                                setStudentFormData({
                                  ...studentFormData,
                                  teamIds: studentFormData.teamIds.filter(id => id !== t.id)
                                });
                              }
                            }}
                          />
                          <div className="multiselect-label-content">
                            <span className="multiselect-primary-name">{t.name}</span>
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                              {t.department || 'Research Team'}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-form-actions-row">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowStudentModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-blue"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Saving to Supabase...'
                      : (editingStudent ? 'Update Student' : 'Save Student to Database')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK MANAGE CHALLENGE ASSIGNMENTS FOR A TEAM                    */}
      {/* ========================================================================= */}
      {assigningTeam && (
        <div className="modal-backdrop-overlay" onClick={() => setAssigningTeam(null)}>
          <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="modal-heading-title">Assign Challenges: {assigningTeam.name}</h2>
                <p className="modal-subheading-text">
                  A single team can work on multiple civic problems associated with your university.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setAssigningTeam(null)}
              >
                ✕
              </button>
            </div>

            <div className="team-modal-body">
              {availableAcceptedChallenges.length === 0 ? (
                <div className="empty-accepted-box" style={{ margin: '1rem 0' }}>
                  <h3>No Accepted Challenges</h3>
                  <p>
                    Your university has not accepted any civic challenges yet.
                    Browse open challenges and accept them to assign them to this team.
                  </p>
                  {onNavigateToDiscover && (
                    <button
                      type="button"
                      className="btn btn-blue"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => {
                        setAssigningTeam(null);
                        onNavigateToDiscover();
                      }}
                    >
                      Browse Open Problems
                    </button>
                  )}
                </div>
              ) : (
                <div className="team-problems-toggle-list">
                  {availableAcceptedChallenges.map((prob) => {
                    const isAssigned = (assigningTeam.associated_to || assigningTeam.assignedProblemIds || []).some(
                      id => String(id) === String(prob.postId)
                    );
                    return (
                      <div
                        key={prob.id}
                        className={`problem-toggle-row ${isAssigned ? 'is-assigned' : ''}`}
                      >
                        <div className="problem-toggle-info">
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="tag-pill category-tag-xs">{prob.category}</span>
                            <span className="tag-pill" style={{ fontSize: '0.7rem' }}>
                              Progress: {prob.progress || 0}%
                            </span>
                          </div>
                          <h4 className="problem-toggle-title">{prob.title}</h4>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${isAssigned ? 'btn-outline text-danger' : 'btn-blue'}`}
                          onClick={() => handleToggleProblem(assigningTeam.id, prob.postId)}
                        >
                          {isAssigned ? 'Unassign' : 'Assign to Team'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-form-actions-row">
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => setAssigningTeam(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
