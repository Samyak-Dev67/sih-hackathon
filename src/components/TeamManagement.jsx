import React, { useState, useEffect } from 'react';
import {
  getUniversityStudents,
  getUniversityTeams,
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
  const [teams, setTeams] = useState(() => getUniversityTeams(universityId));
  const [students, setStudents] = useState(() => getUniversityStudents(universityId));

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

  // Reload data from storage
  const reloadData = () => {
    setTeams(getUniversityTeams(universityId));
    setStudents(getUniversityStudents(universityId));
  };

  useEffect(() => {
    reloadData();
  }, [universityId]);

  // Compute metrics
  const totalTeams = teams.length;
  const totalStudents = students.length;
  const uniqueAssignedProblemIds = new Set(teams.flatMap(t => t.assignedProblemIds || []));
  const assignedProblemsCount = uniqueAssignedProblemIds.size;

  // Filtered teams
  const filteredTeams = teams.filter(t => {
    if (!teamSearch.trim()) return true;
    const q = teamSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // Team Modal Handlers
  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
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
    setTeamFormData({
      name: team.name || '',
      department: team.department || '',
      description: team.description || '',
      studentIds: [...(team.studentIds || [])],
      assignedProblemIds: [...(team.assignedProblemIds || [])]
    });
    setShowTeamModal(true);
  };

  const handleSaveTeam = (e) => {
    e.preventDefault();
    if (!teamFormData.name.trim()) return;

    if (editingTeam) {
      updateUniversityTeam(universityId, editingTeam.id, teamFormData);
    } else {
      createUniversityTeam(universityId, teamFormData);
    }
    reloadData();
    setShowTeamModal(false);
  };

  const handleDeleteTeam = (teamId, teamName) => {
    if (window.confirm(`Are you sure you want to delete team "${teamName}"?`)) {
      deleteUniversityTeam(universityId, teamId);
      reloadData();
    }
  };

  // Student Modal Handlers
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentFormData({
      name: '',
      role: '',
      department: '',
      email: '',
      teamIds: []
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    const memberOfTeams = teams.filter(t => (t.studentIds || []).includes(student.id)).map(t => t.id);
    setStudentFormData({
      name: student.name || '',
      role: student.role || '',
      department: student.department || '',
      email: student.email || '',
      teamIds: memberOfTeams
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!studentFormData.name.trim()) return;

    if (editingStudent) {
      updateUniversityStudent(universityId, editingStudent.id, studentFormData);
      teams.forEach(team => {
        const shouldBeIn = studentFormData.teamIds.includes(team.id);
        const currentlyIn = (team.studentIds || []).includes(editingStudent.id);
        if (shouldBeIn && !currentlyIn) {
          updateUniversityTeam(universityId, team.id, {
            studentIds: [...team.studentIds, editingStudent.id]
          });
        } else if (!shouldBeIn && currentlyIn) {
          updateUniversityTeam(universityId, team.id, {
            studentIds: team.studentIds.filter(id => id !== editingStudent.id)
          });
        }
      });
    } else {
      addUniversityStudent(universityId, studentFormData);
    }
    reloadData();
    setShowStudentModal(false);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    if (window.confirm(`Remove ${studentName} from the university student directory?`)) {
      deleteUniversityStudent(universityId, studentId);
      reloadData();
    }
  };

  // Quick Problem Assignment Modal Handlers
  const handleToggleProblem = (teamId, postId) => {
    toggleTeamProblemAssignment(universityId, teamId, postId);
    reloadData();
    if (assigningTeam && assigningTeam.id === teamId) {
      const updatedTeams = getUniversityTeams(universityId);
      setAssigningTeam(updatedTeams.find(t => t.id === teamId) || null);
    }
  };

  return (
    <div className="uni-team-management-dashboard">
      {/* Header Banner */}
      <div className="uni-workspace-header-row">
        <div>
          <h1 className="uni-workspace-title">Team Management</h1>
          <p className="uni-workspace-subtitle">
            Assemble student research teams, designate specific roles, and assign teams to multiple accepted challenges.
          </p>
        </div>
        <div className="uni-team-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleOpenAddStudent}
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
          <span className="uni-metric-value text-blue">{totalTeams}</span>
        </div>

        <div className="uni-metric-card">
          <span className="uni-metric-label">STUDENT RESEARCHERS</span>
          <span className="uni-metric-value text-orange">{totalStudents}</span>
        </div>

        <div className="uni-metric-card">
          <span className="uni-metric-label">CHALLENGES COVERED</span>
          <span className="uni-metric-value text-green">{assignedProblemsCount}</span>
        </div>
      </div>

      {/* Subnav Toggle: Teams vs Students Directory */}
      <div className="uni-team-subnav">
        <button
          type="button"
          className={`uni-team-subnav-btn ${subTab === 'teams' ? 'active' : ''}`}
          onClick={() => setSubTab('teams')}
        >
          Research Teams ({teams.length})
        </button>
        <button
          type="button"
          className={`uni-team-subnav-btn ${subTab === 'students' ? 'active' : ''}`}
          onClick={() => setSubTab('students')}
        >
          Student Directory ({students.length})
        </button>
      </div>

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
                const teamStudents = students.filter(s => (team.studentIds || []).includes(s.id));
                const teamProblemIds = team.assignedProblemIds || [];
                const assignedChallenges = acceptedProblems.filter(p =>
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
                        <button
                          type="button"
                          className="btn-link-action"
                          onClick={() => setAssigningTeam(team)}
                        >
                          Manage Assignments →
                        </button>
                      </div>

                      {assignedChallenges.length === 0 ? (
                        <div className="team-no-problems-notice">
                          <span>Not assigned to any challenges yet.</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setAssigningTeam(team)}
                            style={{ marginTop: '0.4rem' }}
                          >
                            + Assign Problems
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
                              <button
                                type="button"
                                className="btn-table-workspace"
                                onClick={() => onOpenWorkspace && onOpenWorkspace(challenge.postId)}
                              >
                                Workspace →
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Team Members Roster */}
                    <div className="team-section-divider" />
                    <div className="team-members-block">
                      <div className="team-section-header-row">
                        <span className="team-section-subheading">
                          Team Members ({teamStudents.length})
                        </span>
                        <button
                          type="button"
                          className="btn-link-action"
                          onClick={() => handleOpenEditTeam(team)}
                        >
                          Edit Roster
                        </button>
                      </div>

                      {teamStudents.length === 0 ? (
                        <div className="team-no-members-notice">
                          <span>No students assigned to this team yet.</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditTeam(team)}
                            style={{ marginTop: '0.4rem' }}
                          >
                            + Add Members
                          </button>
                        </div>
                      ) : (
                        <div className="team-students-list">
                          {teamStudents.map((stu) => (
                            <div key={stu.id} className="team-student-chip">
                              <div className="student-avatar-badge">{stu.initials}</div>
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
                  onClick={handleOpenAddStudent}
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
                      const studentTeams = teams.filter(t => (t.studentIds || []).includes(student.id));
                      return (
                        <tr key={student.id}>
                          <td>
                            <div className="student-table-name-cell">
                              <div className="student-avatar-badge">{student.initials}</div>
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
        <div className="modal-backdrop-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="modal-heading-title">
                {editingTeam ? 'Edit Research Team' : 'Create New Research Team'}
              </h2>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowTeamModal(false)}
              >
                ✕
              </button>
            </div>

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
                />
              </div>

              {/* Assign Students: Multi-student selection */}
              <div className="form-group-item">
                <label className="form-item-label">
                  Assign Student Researchers ({teamFormData.studentIds.length} selected)
                </label>
                <p className="form-help-hint">Select students from your university roster to join this team.</p>
                {students.length === 0 ? (
                  <div className="form-empty-hint">
                    No students found. Add students to the student directory first.
                  </div>
                ) : (
                  <div className="team-multiselect-box">
                    {students.map((stu) => {
                      const isChecked = teamFormData.studentIds.includes(stu.id);
                      return (
                        <label key={stu.id} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTeamFormData({
                                  ...teamFormData,
                                  studentIds: [...teamFormData.studentIds, stu.id]
                                });
                              } else {
                                setTeamFormData({
                                  ...teamFormData,
                                  studentIds: teamFormData.studentIds.filter(id => id !== stu.id)
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
                {acceptedProblems.length === 0 ? (
                  <div className="form-empty-hint">
                    No accepted challenges yet. Accept problems from Discover Open Problems to assign them to this team.
                  </div>
                ) : (
                  <div className="team-multiselect-box">
                    {acceptedProblems.map((prob) => {
                      const isChecked = teamFormData.assignedProblemIds.some(id => String(id) === String(prob.postId));
                      return (
                        <label key={prob.id} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT STUDENT                                              */}
      {/* ========================================================================= */}
      {showStudentModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="modal-heading-title">
                {editingStudent ? 'Edit Student Researcher' : 'Add Student Researcher'}
              </h2>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowStudentModal(false)}
              >
                ✕
              </button>
            </div>

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
                />
                <div className="suggested-roles-chips">
                  <span className="suggested-roles-label">Quick Suggestions:</span>
                  {SUGGESTED_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className="suggested-role-chip"
                      onClick={() => setStudentFormData({ ...studentFormData, role })}
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
                />
              </div>

              {/* Team Assignment */}
              <div className="form-group-item">
                <label className="form-item-label">Assign to Teams</label>
                <p className="form-help-hint">Students can be enrolled in multiple research teams.</p>
                {teams.length === 0 ? (
                  <div className="form-empty-hint">
                    No teams created yet. You can create a team and assign this student later.
                  </div>
                ) : (
                  <div className="team-multiselect-box">
                    {teams.map((t) => {
                      const isChecked = studentFormData.teamIds.includes(t.id);
                      return (
                        <label key={t.id} className={`multiselect-row-item ${isChecked ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
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
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>{t.department}</span>
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
                  onClick={() => setShowStudentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                >
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
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
              {acceptedProblems.length === 0 ? (
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
                  {acceptedProblems.map((prob) => {
                    const isAssigned = (assigningTeam.assignedProblemIds || []).some(
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
