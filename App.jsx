import React, { useEffect, useMemo, useState } from 'react';
import {
  NAV,
  PASS,
  ROLE_TITLE,
  TIME_SLOTS,
  ago,
  byId,
  className,
  clearSession,
  clone,
  defaulters,
  departmentCode,
  deptName,
  downloadFile,
  emailFromRegisterNo,
  fetchStore,
  initializeLocalStore,
  nextFacultyEmail,
  findAttendance,
  fmtPct,
  getStatusTone,
  loadSession,
  persistStore,
  persistStoreLocal,
  resetStoreRemote,
  saveSession,
  sha256,
  studentSummary,
  subjectLabel,
  today,
  uid,
  userName
} from './appCore';

function App() {
  const [store, setStore] = useState(null);
  const [session, setSession] = useState(() => loadSession());
  const [activeView, setActiveView] = useState(null);
  const [bootError, setBootError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [storageMode, setStorageMode] = useState('server');

  useEffect(() => {
    document.body.className = session ? 'portal-page' : 'login-page';
    return () => {
      document.body.className = '';
    };
  }, [session]);

  useEffect(() => {
    let ignore = false;

    async function loadRemoteStore() {
      try {
        const remoteStore = await fetchStore();
        if (!ignore) {
          setStore(remoteStore);
          setBootError('');
          setStorageMode('server');
        }
      } catch (error) {
        if (!ignore) {
          const localStore = initializeLocalStore();
          setStore(localStore);
          setBootError('');
          setStorageMode('local');
        }
      }
    }

    loadRemoteStore();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
    else clearSession();
  }, [session]);

  const currentUser = useMemo(
    () => (session && store ? store.users.find((user) => user.id === session.userId) || null : null),
    [session, store]
  );

  useEffect(() => {
    if (!currentUser) {
      setActiveView(null);
      return;
    }
    const nav = NAV[currentUser.role] || [];
    if (!activeView || !nav.some((item) => item.id === activeView)) {
      setActiveView(nav[0]?.id || null);
    }
  }, [activeView, currentUser]);

  const updateStore = async (mutator) => {
    if (!store) return;
    const next = clone(store);
    mutator(next);
    setStore(next);
    setSaveError('');
    try {
      const saved = await persistStore(next);
      setStore(saved);
      setStorageMode('server');
    } catch (error) {
      persistStoreLocal(next);
      setSaveError('Server unavailable. Changes are saved locally in this browser.');
      setStorageMode('local');
    }
  };

  const handleLogout = () => setSession(null);

  if (!store && !bootError) {
    return <LoadingScreen message="Connecting to the server and loading data..." />;
  }

  if (bootError) {
    return <LoadingScreen message={bootError} isError />;
  }

  if (!currentUser) {
    return <LoginPage store={store} onLogin={setSession} />;
  }

  return (
    <PortalShell
      store={store}
      updateStore={updateStore}
      currentUser={currentUser}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={handleLogout}
      saveError={saveError}
      setStore={setStore}
      storageMode={storageMode}
    />
  );
}

function LoadingScreen({ message, isError = false }) {
  return (
    <div className="page-wrap">
      <section className="login-view">
        <article className="login-card">
          <h3>{isError ? 'Connection Error' : 'Loading'}</h3>
          <p className={isError ? 'error-text' : 'helper'}>{message}</p>
        </article>
      </section>
    </div>
  );
}

function LoginPage({ store, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('any');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }

    setBusy(true);
    const hash = await sha256(password);
    const user = store.users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.passwordHash === hash && (role === 'any' || item.role === role)
    );
    setBusy(false);

    if (!user) {
      setError('Invalid credentials.');
      return;
    }

    onLogin({ userId: user.id, at: new Date().toISOString() });
    setEmail('');
    setPassword('');
    setRole('any');
  };

  return (
    <div className="page-wrap">
      <section className="login-view">
        <h1 className="hero-title">LOGIN PAGE</h1>
        <div className="login-grid" style={{ gridTemplateColumns: 'minmax(360px, 680px)', justifyContent: 'center' }}>
          <article className="login-card">
            <div className="brand-lockup">
              <div className="cap-icon">VEMU</div>
              <div>
                <h2>Student Attendance</h2>
                <p>Management System</p>
              </div>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter Email" required />
              </label>
              <label>
                Password
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" required />
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="any">Auto detect</option>
                  <option value="admin">Admin</option>
                  <option value="hod">HOD</option>
                  <option value="faculty">Faculty</option>
                  <option value="student">Student</option>
                </select>
              </label>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Signing In...' : 'Login'}</button>
              <p className="error-text" aria-live="polite">{error}</p>
            </form>
          </article>
        </div>
      </section>
    </div>
  );
}

function PortalShell({ store, updateStore, currentUser, activeView, setActiveView, onLogout, saveError, setStore, storageMode }) {
  const nav = NAV[currentUser.role] || [];
  const currentNav = nav.find((item) => item.id === activeView);

  return (
    <div className="page-wrap portal-app">
      <section className="portal-view">
        <div className="portal-shell">
          <header className="portal-topbar">
            <div className="portal-brand">Student Attendance Management System</div>
            <div className="portal-user">
              <span className="identity-pill">{currentUser.name} | {ROLE_TITLE[currentUser.role]}</span>
              <button id="logout-btn" className="btn-ghost" type="button" onClick={onLogout}>Logout</button>
            </div>
          </header>

          <div className="portal-layout">
            <aside className="portal-sidebar">
              {nav.map((item) => (
                <button
                  key={item.id}
                  className={`nav-btn ${item.id === activeView ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </aside>
            <main className="portal-main">
              <h2 className="workspace-title">{currentNav ? currentNav.label.toUpperCase() : 'DASHBOARD'}</h2>
              {storageMode === 'local' ? <p className="notice">Server/MongoDB is unavailable right now. The app is running with local browser storage.</p> : null}
              {saveError ? <p className="error-text">{saveError}</p> : null}
              <div className="content-area">
                <RoleView
                  store={store}
                  updateStore={updateStore}
                  currentUser={currentUser}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  setStore={setStore}
                />
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoleView(props) {
  const { currentUser, activeView } = props;
  if (currentUser.role === 'admin') return <AdminViews {...props} view={activeView} />;
  if (currentUser.role === 'faculty') return <FacultyViews {...props} view={activeView} />;
  if (currentUser.role === 'student') return <StudentViews {...props} view={activeView} />;
  return <HodViews {...props} view={activeView} />;
}

function AdminViews({ view, ...props }) {
  if (view === 'admin-dashboard') return <AdminDashboard {...props} />;
  if (view === 'admin-users') return <AdminUsers {...props} />;
  if (view === 'admin-departments') return <AdminDepartments {...props} />;
  if (view === 'admin-reports') return <AdminReports {...props} />;
  return <AdminSettings {...props} />;
}

function FacultyViews({ view, ...props }) {
  if (view === 'faculty-dashboard') return <FacultyDashboard {...props} />;
  if (view === 'faculty-mark') return <FacultyMark {...props} />;
  if (view === 'faculty-view') return <FacultyView {...props} />;
  if (view === 'faculty-reports') return <FacultyReports {...props} />;
  return <PasswordSettingsCard {...props} title="Change Password" includeNotifications={false} />;
}

function StudentViews({ view, ...props }) {
  if (view === 'student-dashboard') return <StudentDashboard {...props} />;
  if (view === 'student-view') return <StudentView {...props} />;
  if (view === 'student-download') return <StudentDownload {...props} />;
  return <PasswordSettingsCard {...props} title="Password & Notifications" includeNotifications />;
}

function HodViews({ view, ...props }) {
  if (view === 'hod-dashboard') return <HodDashboard {...props} />;
  if (view === 'hod-status') return <HodStatus {...props} />;
  if (view === 'hod-courses') return <HodCourses {...props} />;
  if (view === 'hod-reports') return <HodReports {...props} />;
  return <HodSettings {...props} />;
}

function AdminDashboard({ store, setActiveView }) {
  const students = store.users.filter((user) => user.role === 'student');
  const faculty = store.users.filter((user) => user.role === 'faculty');

  return (
    <>
      <section className="grid cols-3">
        <article className="card"><h3>Total Students</h3><p className="metric">{students.length}</p></article>
        <article className="card"><h3>Total Teachers</h3><p className="metric">{faculty.length}</p></article>
        <article className="card"><h3>Detains</h3><p className="metric">{defaulters(store).length}</p></article>
      </section>

      <section className="section">
        <h3 className="section-title">Admin - Dashboard</h3>
        <div className="inline-actions">
          <button type="button" onClick={() => setActiveView('admin-users')}>+ Add Student</button>
          <button type="button" onClick={() => setActiveView('admin-departments')}>+ Add Department</button>
        </div>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead><tr><th>Name</th><th>Roll No.</th><th>Department</th><th>Email</th></tr></thead>
            <tbody>
              {students.slice(0, 8).length ? students.slice(0, 8).map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.registerNo || '-'}</td>
                  <td>{className(store, student.classId)}</td>
                  <td>{student.email}</td>
                </tr>
              )) : <tr><td colSpan="4">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AdminUsers({ store, updateStore }) {
  const [form, setForm] = useState({ role: 'student', name: '', email: '', registerNo: '', departmentId: store.departments[0]?.id || '', classId: store.classes[0]?.id || '' });
  const [selectedDepartment, setSelectedDepartment] = useState(store.departments[0]?.id || '');
  const roleOrder = { admin: 0, hod: 1, faculty: 2, student: 3 };
  const departmentTabs = store.departments.map((department) => ({
    id: department.id,
    label: departmentCode(department)
  }));

  const deptShortLabel = (departmentId) => {
    return departmentCode(byId(store.departments, departmentId));
  };

  const users = store.users
    .filter((user) => {
      if (!['student', 'faculty', 'admin', 'hod'].includes(user.role)) return false;
      if (user.role === 'admin') return true;
      const userDepartmentId = user.role === 'student' ? byId(store.classes, user.classId)?.departmentId : user.departmentId;
      return userDepartmentId === selectedDepartment;
    })
    .slice()
    .sort((a, b) => {
      const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.role === 'student' && !form.registerNo.trim()) return;
    if (!['student', 'faculty'].includes(form.role) && !form.email.trim()) return;

    updateStore((draft) => {
      const resolvedEmail = form.role === 'student'
        ? emailFromRegisterNo(form.registerNo, form.name)
        : form.role === 'faculty'
          ? (form.email.trim().toLowerCase() || nextFacultyEmail(draft.users))
          : form.email.trim().toLowerCase();
      draft.users.push({
        id: uid('u'),
        role: form.role,
        name: form.name.trim(),
        email: resolvedEmail,
        passwordHash: form.role === 'faculty' ? PASS.faculty : form.role === 'admin' ? PASS.admin : form.role === 'hod' ? PASS.hod : PASS.student,
        departmentId: form.role === 'student' ? byId(draft.classes, form.classId)?.departmentId || form.departmentId : form.departmentId,
        classId: form.role === 'student' ? form.classId : null,
        registerNo: form.role === 'student' ? form.registerNo.trim().toUpperCase() : null
      });
    });

    setForm((prev) => ({ ...prev, name: '', email: '', registerNo: '' }));
  };

  const editUser = (user) => {
    const name = window.prompt('Name', user.name);
    if (!name) return;
    const email = user.role === 'student'
      ? emailFromRegisterNo(user.registerNo, user.id)
      : user.role === 'faculty'
        ? user.email
        : window.prompt('Email', user.email) || user.email;
    updateStore((draft) => {
      const current = byId(draft.users, user.id);
      if (current) {
        current.name = name.trim();
        current.email = email.trim().toLowerCase();
      }
    });
  };

  const deleteUser = (userId) => {
    updateStore((draft) => {
      draft.users = draft.users.filter((user) => user.id !== userId);
      draft.assignments = draft.assignments.filter((assignment) => assignment.facultyId !== userId);
      draft.attendance = draft.attendance.filter((record) => record.studentId !== userId && record.facultyId !== userId);
      draft.notifications = draft.notifications.filter((note) => note.toUserId !== userId && note.fromUserId !== userId);
    });
  };

  return (
    <section className="section">
      <form className="compact-form two-col" onSubmit={handleSubmit}>
        <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="student">Student</option><option value="faculty">Faculty</option><option value="admin">Admin</option><option value="hod">HOD</option></select></label>
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Register No<input value={form.registerNo} onChange={(e) => setForm({ ...form, registerNo: e.target.value })} placeholder="Student only" /></label>
        <label>Department<select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>{store.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label>Class<select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>{store.classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select></label>
        <button type="submit">+ Add User</button>
      </form>
      <div className="subtabs" style={{ marginTop: 10 }}>
        {departmentTabs.map((department) => (
          <span
            key={department.id}
            className={selectedDepartment === department.id ? 'active' : ''}
            onClick={() => setSelectedDepartment(department.id)}
            style={{ cursor: 'pointer' }}
          >
            {department.label}
          </span>
        ))}
      </div>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead><tr><th>Name</th><th>Roll No.</th><th>Class / Dept</th><th>Role</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {users.length ? users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.registerNo || '-'}</td>
                <td>{user.role === 'student' ? className(store, user.classId) : deptShortLabel(user.departmentId)}</td>
                <td>{user.role}</td>
                <td>{user.email}</td>
                <td>
                  <div className="inline-actions">
                    <button type="button" onClick={() => editUser(user)}>Edit</button>
                    <button type="button" className="btn-danger" onClick={() => deleteUser(user.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="6">No users found for this department.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDepartments({ store, updateStore }) {
  const [form, setForm] = useState({ name: '', code: '' });

  const createDepartmentId = (name, code) => {
    const base = String(code || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `dep-${base || uid('dep')}`;
  };

  const addDepartment = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name) return;

    updateStore((draft) => {
      const nextId = createDepartmentId(name, code);
      const nameExists = draft.departments.some((department) => department.name.toLowerCase() === name.toLowerCase());
      const idExists = draft.departments.some((department) => department.id === nextId);
      if (nameExists || idExists) return;
      draft.departments.push({ id: nextId, name });
    });

    setForm({ name: '', code: '' });
  };

  return (
    <section className="section">
      <article className="card">
        <h4>Add Department</h4>
        <form className="compact-form two-col" onSubmit={addDepartment}>
          <label>Department Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter department name" required /></label>
          <label>Short Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Example: AI" /></label>
          <button type="submit">Add Department</button>
        </form>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h4>Department List</h4>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Department Name</th><th>Action</th></tr></thead>
            <tbody>
              {store.departments.length ? store.departments.map((department) => (
                <tr key={department.id}>
                  <td>{departmentCode(department)}</td>
                  <td>{department.name}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => updateStore((draft) => {
                        draft.departments = draft.departments.filter((item) => item.id !== department.id);
                        draft.classes = draft.classes.filter((item) => item.departmentId !== department.id);
                        draft.subjects = draft.subjects.filter((item) => item.departmentId !== department.id);
                        draft.users = draft.users.filter((item) => item.role === 'admin' || item.departmentId !== department.id);
                        draft.assignments = draft.assignments.filter((assignment) => {
                          const classItem = byId(draft.classes, assignment.classId);
                          const subjectItem = byId(draft.subjects, assignment.subjectId);
                          const facultyItem = byId(draft.users, assignment.facultyId);
                          return !!classItem && !!subjectItem && !!facultyItem;
                        });
                        draft.attendance = draft.attendance.filter((attendance) => {
                          const classItem = byId(draft.classes, attendance.classId);
                          const subjectItem = byId(draft.subjects, attendance.subjectId);
                          const facultyItem = byId(draft.users, attendance.facultyId);
                          const studentItem = byId(draft.users, attendance.studentId);
                          return !!classItem && !!subjectItem && !!facultyItem && !!studentItem;
                        });
                      })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan="3">No departments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function AdminCourses({ store, updateStore }) {
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', departmentId: store.departments[0]?.id || '' });

  const addSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) return;
    updateStore((draft) => {
      draft.subjects.push({
        id: uid('sub'),
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        departmentId: subjectForm.departmentId
      });
    });
    setSubjectForm((prev) => ({ ...prev, name: '', code: '' }));
  };

  return (
    <section className="section">
      <article className="card">
        <h4>Add Subject</h4>
        <form className="compact-form" onSubmit={addSubject}>
          <label>Subject Name<input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required /></label>
          <label>Code<input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required /></label>
          <label>Department<select value={subjectForm.departmentId} onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}>{store.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <button type="submit">Add Subject</button>
        </form>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h4>Manage Subjects</h4>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject Name</th><th>Department</th><th>Code</th><th>Actions</th></tr></thead>
            <tbody>
              {store.subjects.length ? store.subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.name}</td>
                  <td>{deptName(store, subject.departmentId)}</td>
                  <td>{subject.code}</td>
                  <td><button type="button" className="btn-danger" onClick={() => updateStore((draft) => { draft.subjects = draft.subjects.filter((item) => item.id !== subject.id); draft.assignments = draft.assignments.filter((item) => item.subjectId !== subject.id); draft.attendance = draft.attendance.filter((item) => item.subjectId !== subject.id); })}>Delete</button></td>
                </tr>
              )) : <tr><td colSpan="4">No subjects.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function HodCourses({ store, updateStore, currentUser }) {
  const departmentId = currentUser.departmentId;
  const departmentSubjects = store.subjects.filter((subject) => subject.departmentId === departmentId);
  const departmentClasses = store.classes.filter((cls) => cls.departmentId === departmentId);
  const departmentFaculty = store.users.filter((user) => user.role === 'faculty' && user.departmentId === departmentId);
  const departmentAssignments = store.assignments.filter((assignment) => {
    const classItem = byId(store.classes, assignment.classId);
    const subjectItem = byId(store.subjects, assignment.subjectId);
    return classItem?.departmentId === departmentId && subjectItem?.departmentId === departmentId;
  });

  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [assignForm, setAssignForm] = useState({
    facultyId: departmentFaculty[0]?.id || '',
    classId: departmentClasses[0]?.id || '',
    subjectId: departmentSubjects[0]?.id || ''
  });

  useEffect(() => {
    setAssignForm((prev) => ({
      facultyId: departmentFaculty.some((user) => user.id === prev.facultyId) ? prev.facultyId : (departmentFaculty[0]?.id || ''),
      classId: departmentClasses.some((cls) => cls.id === prev.classId) ? prev.classId : (departmentClasses[0]?.id || ''),
      subjectId: departmentSubjects.some((subject) => subject.id === prev.subjectId) ? prev.subjectId : (departmentSubjects[0]?.id || '')
    }));
  }, [
    departmentId,
    departmentFaculty.map((user) => user.id).join(','),
    departmentClasses.map((cls) => cls.id).join(','),
    departmentSubjects.map((subject) => subject.id).join(',')
  ]);

  const addSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) return;
    updateStore((draft) => {
      draft.subjects.push({
        id: uid('sub'),
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        departmentId
      });
    });
    setSubjectForm({ name: '', code: '' });
  };

  const addAssignment = (e) => {
    e.preventDefault();
    if (!assignForm.facultyId || !assignForm.classId || !assignForm.subjectId) return;
    updateStore((draft) => {
      if (draft.assignments.some((assignment) => assignment.facultyId === assignForm.facultyId && assignment.classId === assignForm.classId && assignment.subjectId === assignForm.subjectId)) return;
      draft.assignments.push({ id: uid('as'), ...assignForm });
    });
    setAssignForm((prev) => ({
      facultyId: prev.facultyId || departmentFaculty[0]?.id || '',
      classId: prev.classId || departmentClasses[0]?.id || '',
      subjectId: departmentSubjects[0]?.id || prev.subjectId || ''
    }));
  };

  return (
    <section className="section">
      <div className="grid cols-2">
        <article className="card">
          <h4>Manage Subjects</h4>
          <form className="compact-form" onSubmit={addSubject}>
            <label>Subject Name<input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required /></label>
            <label>Code<input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required /></label>
            <label>Department<input value={deptName(store, departmentId)} readOnly /></label>
            <button type="submit">Add Subject</button>
          </form>
        </article>
        <article className="card">
          <h4>Assignments</h4>
          <form className="compact-form" onSubmit={addAssignment}>
            <label>Teacher<select value={assignForm.facultyId} onChange={(e) => setAssignForm({ ...assignForm, facultyId: e.target.value })}>{departmentFaculty.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <label>Class<select value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}>{departmentClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select></label>
            <label>Subject<select value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}>{departmentSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subjectLabel(store, subject.id)}</option>)}</select></label>
            <button type="submit">Assign</button>
          </form>
        </article>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <article className="card">
          <h4>Department Subjects</h4>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject Name</th><th>Department</th><th>Code</th><th>Actions</th></tr></thead>
              <tbody>
                {departmentSubjects.length ? departmentSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>{subject.name}</td>
                    <td>{deptName(store, subject.departmentId)}</td>
                    <td>{subject.code}</td>
                    <td><button type="button" className="btn-danger" onClick={() => updateStore((draft) => { draft.subjects = draft.subjects.filter((item) => item.id !== subject.id); draft.assignments = draft.assignments.filter((item) => item.subjectId !== subject.id); draft.attendance = draft.attendance.filter((item) => item.subjectId !== subject.id); })}>Delete</button></td>
                  </tr>
                )) : <tr><td colSpan="4">No subjects.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
        <article className="card">
          <h4>Department Assignments</h4>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Action</th></tr></thead>
              <tbody>
                {departmentAssignments.length ? departmentAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{userName(store, assignment.facultyId)}</td>
                    <td>{className(store, assignment.classId)}</td>
                    <td>{subjectLabel(store, assignment.subjectId)}</td>
                    <td><button type="button" className="btn-danger" onClick={() => updateStore((draft) => { draft.assignments = draft.assignments.filter((item) => item.id !== assignment.id); draft.attendance = draft.attendance.filter((item) => !(item.facultyId === assignment.facultyId && item.classId === assignment.classId && item.subjectId === assignment.subjectId)); })}>Delete</button></td>
                  </tr>
                )) : <tr><td colSpan="4">No assignments.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

function AdminReports({ store }) {
  const [filter, setFilter] = useState({ classId: '', subjectId: '', from: store.rules.semesterStart, to: today() });

  const rows = store.users
    .filter((user) => user.role === 'student' && (!filter.classId || user.classId === filter.classId))
    .map((student) => {
      const records = findAttendance(store, { studentId: student.id, classId: filter.classId || undefined, subjectId: filter.subjectId || undefined, from: filter.from, to: filter.to });
      return { student, pct: records.length ? records.filter((record) => record.status === 'present').length / records.length * 100 : 0 };
    })
    .sort((a, b) => a.pct - b.pct || a.student.name.localeCompare(b.student.name));

  const downloadCsv = () => {
    const lines = ['Name,Class,Subject,From,To,Attendance'];
    rows.forEach((row) => {
      lines.push(`${row.student.name},${className(store, row.student.classId)},${filter.subjectId ? subjectLabel(store, filter.subjectId) : 'All'},${filter.from},${filter.to},${row.pct.toFixed(2)}`);
    });
    downloadFile(`attendance-report-${today()}.csv`, lines.join('\n'), 'text/csv');
  };

  return (
    <section className="section">
      <form className="compact-form two-col" onSubmit={(e) => e.preventDefault()}>
        <label>Class<select value={filter.classId} onChange={(e) => setFilter({ ...filter, classId: e.target.value })}><option value="">Select Class</option>{store.classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select></label>
        <label>Subject<select value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}><option value="">Select Subject</option>{store.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subjectLabel(store, subject.id)}</option>)}</select></label>
        <label>From<input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></label>
        <label>To<input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} /></label>
      </form>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead><tr><th>Name</th><th>Class</th><th>Subject</th><th>Date Range</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.student.id}>
                <td>{row.student.name}</td>
                <td>{className(store, row.student.classId)}</td>
                <td>{filter.subjectId ? subjectLabel(store, filter.subjectId) : 'All'}</td>
                <td>{filter.from} to {filter.to}</td>
                <td><span className={`tag ${getStatusTone(store, row.pct)}`}>{fmtPct(row.pct)}</span></td>
              </tr>
            )) : <tr><td colSpan="5">No records.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="inline-actions"><button type="button" onClick={downloadCsv}>Download CSV</button></div>
    </section>
  );
}

function AdminSettings({ store, updateStore, setStore }) {
  const [calendarForm, setCalendarForm] = useState({ date: today(), title: '' });

  return (
    <>
      <section className="card">
        <h4>Attendance Rules</h4>
        <form className="compact-form two-col" onSubmit={(e) => { e.preventDefault(); }}>
          <label>Minimum Attendance<input type="number" value={store.rules.minAttendance} onChange={(e) => updateStore((draft) => { draft.rules.minAttendance = Number(e.target.value || 0); })} /></label>
          <label>Editable Past Days<input type="number" value={store.rules.allowEditPastDays} onChange={(e) => updateStore((draft) => { draft.rules.allowEditPastDays = Number(e.target.value || 0); })} /></label>
        </form>
      </section>

      <section className="card">
        <h4>Academic Calendar</h4>
        <form className="compact-form two-col" onSubmit={(e) => {
          e.preventDefault();
          if (!calendarForm.title.trim()) return;
          updateStore((draft) => {
            draft.calendar.push({ id: uid('cal'), date: calendarForm.date, title: calendarForm.title.trim() });
          });
          setCalendarForm({ date: today(), title: '' });
        }}>
          <label>Date<input type="date" value={calendarForm.date} onChange={(e) => setCalendarForm({ ...calendarForm, date: e.target.value })} /></label>
          <label>Event<input value={calendarForm.title} onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })} /></label>
          <button type="submit">Add Event</button>
        </form>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead><tr><th>Date</th><th>Event</th><th>Action</th></tr></thead>
            <tbody>
              {[...store.calendar].sort((a, b) => a.date.localeCompare(b.date)).length ? [...store.calendar].sort((a, b) => a.date.localeCompare(b.date)).map((event) => (
                <tr key={event.id}>
                  <td>{event.date}</td>
                  <td>{event.title}</td>
                  <td><button type="button" className="btn-danger" onClick={() => updateStore((draft) => { draft.calendar = draft.calendar.filter((item) => item.id !== event.id); })}>Delete</button></td>
                </tr>
              )) : <tr><td colSpan="3">No events.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h4>Data Tools</h4>
        <div className="inline-actions">
          <button type="button" onClick={() => downloadFile(`attendance-backup-${today()}.json`, JSON.stringify(store, null, 2), 'application/json')}>Download Backup</button>
          <button type="button" className="btn-danger" onClick={async () => {
            const reset = await resetStoreRemote();
            setStore(reset);
          }}>Reset Demo Data</button>
        </div>
      </section>
    </>
  );
}

function FacultyDashboard({ store, currentUser, setActiveView }) {
  const assignments = store.assignments.filter((assignment) => assignment.facultyId === currentUser.id);
  const pendingToday = assignments.filter((assignment) => findAttendance(store, { facultyId: currentUser.id, classId: assignment.classId, subjectId: assignment.subjectId, date: today() }).length === 0).length;

  return (
    <section className="section">
      <h3 className="section-title">Welcome, {currentUser.name}!</h3>
      <div className="grid cols-3">
        <article className="card"><h4>Today's Classes</h4><p className="metric">{assignments.length}</p></article>
        <article className="card"><h4>Pending Tasks</h4><p className="metric">{pendingToday}</p></article>
        <article className="card"><h4>Notifications</h4><p className="metric">{store.notifications.filter((note) => note.toUserId === currentUser.id).length}</p></article>
      </div>
      <div className="inline-actions">
        <button type="button" onClick={() => setActiveView('faculty-mark')}>Mark Attendance</button>
        <button type="button" onClick={() => setActiveView('faculty-view')}>View Attendance</button>
        <button type="button" onClick={() => setActiveView('faculty-reports')}>Generate Reports</button>
      </div>
    </section>
  );
}

function FacultyMark({ store, updateStore, currentUser }) {
  const assignments = store.assignments.filter((assignment) => assignment.facultyId === currentUser.id);
  const [selection, setSelection] = useState(() => ({
    assignmentId: assignments[0]?.id || '',
    date: today(),
    timeSlot: TIME_SLOTS[0]
  }));
  const [statusMap, setStatusMap] = useState({});

  const assignment = byId(assignments, selection.assignmentId);
  const students = assignment ? store.users.filter((user) => user.role === 'student' && user.classId === assignment.classId) : [];
  const diff = Math.floor((new Date(`${today()}T00:00:00`) - new Date(`${selection.date}T00:00:00`)) / (1000 * 60 * 60 * 24));
  const blocked = diff < 0 || diff > store.rules.allowEditPastDays;

  useEffect(() => {
    if (!assignment || blocked) {
      setStatusMap({});
      return;
    }
    const classStudents = store.users.filter((user) => user.role === 'student' && user.classId === assignment.classId);
    const existing = new Map(
      findAttendance(store, {
        facultyId: currentUser.id,
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        date: selection.date,
        timeSlot: selection.timeSlot
      }).map((item) => [item.studentId, item.status])
    );
    setStatusMap(Object.fromEntries(classStudents.map((student) => [student.id, existing.get(student.id) || 'present'])));
  }, [assignment?.id, assignment?.classId, assignment?.subjectId, blocked, currentUser.id, selection.date, selection.timeSlot, store.attendance, store.users]);

  if (!assignments.length) {
    return <section className="section"><p className="notice">No assigned subjects/classes.</p></section>;
  }

  const submitAttendance = () => {
    if (!assignment || blocked) return;
    updateStore((draft) => {
      draft.attendance = draft.attendance.filter((record) => !(record.facultyId === currentUser.id && record.classId === assignment.classId && record.subjectId === assignment.subjectId && record.date === selection.date && record.timeSlot === selection.timeSlot));
      students.forEach((student) => {
        draft.attendance.push({
          id: uid('att'),
          date: selection.date,
          timeSlot: selection.timeSlot,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          facultyId: currentUser.id,
          studentId: student.id,
          status: statusMap[student.id] || 'present',
          updatedAt: new Date().toISOString()
        });
      });
    });
    window.alert('Attendance submitted.');
  };

  return (
    <section className="section">
      <form className="compact-form two-col" onSubmit={(e) => e.preventDefault()}>
        <label>Select Class & Subject<select value={selection.assignmentId} onChange={(e) => setSelection({ ...selection, assignmentId: e.target.value })}>{assignments.map((item) => <option key={item.id} value={item.id}>{className(store, item.classId)} | {subjectLabel(store, item.subjectId)}</option>)}</select></label>
        <label>Date<input type="date" value={selection.date} onChange={(e) => setSelection({ ...selection, date: e.target.value })} /></label>
        <label>Time Slot<select value={selection.timeSlot} onChange={(e) => setSelection({ ...selection, timeSlot: e.target.value })}>{TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
      </form>
      {blocked ? <p className="notice">Selected date is outside edit permission window.</p> : (
        <>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table>
              <thead><tr><th>Student Name</th><th>Present</th><th>Absent</th></tr></thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td><input type="radio" name={`st-${student.id}`} checked={(statusMap[student.id] || 'present') === 'present'} onChange={() => setStatusMap((prev) => ({ ...prev, [student.id]: 'present' }))} /></td>
                    <td><input type="radio" name={`st-${student.id}`} checked={(statusMap[student.id] || 'present') === 'absent'} onChange={() => setStatusMap((prev) => ({ ...prev, [student.id]: 'absent' }))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inline-actions"><button type="button" onClick={submitAttendance}>Submit Attendance</button></div>
        </>
      )}
    </section>
  );
}

function FacultyView({ store, currentUser }) {
  const assignments = store.assignments.filter((assignment) => assignment.facultyId === currentUser.id);
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || '');
  const [period, setPeriod] = useState('weekly');

  const assignment = byId(assignments, assignmentId);
  const from = period === 'weekly' ? ago(7) : period === 'monthly' ? ago(30) : store.rules.semesterStart;
  const to = today();
  const rows = assignment ? store.users
    .filter((user) => user.role === 'student' && user.classId === assignment.classId)
    .map((student) => {
      const records = findAttendance(store, { studentId: student.id, classId: assignment.classId, subjectId: assignment.subjectId, from, to });
      return { student, total: records.length, pct: records.length ? records.filter((record) => record.status === 'present').length / records.length * 100 : 0 };
    })
    .sort((a, b) => a.pct - b.pct || a.student.name.localeCompare(b.student.name)) : [];

  return (
    <section className="section">
      <form className="compact-form two-col" onSubmit={(e) => e.preventDefault()}>
        <label>Select Class & Subject<select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>{assignments.map((item) => <option key={item.id} value={item.id}>{className(store, item.classId)} | {subjectLabel(store, item.subjectId)}</option>)}</select></label>
        <label>Period<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="semester">Semester</option></select></label>
      </form>
      <div className="notice">{from} to {to}</div>
      <div className="table-wrap" style={{ marginTop: 8 }}>
        <table>
          <thead><tr><th>Student Name</th><th>Total Classes</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row.student.id}><td>{row.student.name}</td><td>{row.total}</td><td>{fmtPct(row.pct)}</td><td><span className={`tag ${getStatusTone(store, row.pct)}`}>{row.pct >= store.rules.minAttendance + 5 ? 'Present' : row.pct >= store.rules.minAttendance ? 'Borderline' : 'Detain'}</span></td></tr>) : <tr><td colSpan="4">No rows.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FacultyReports({ store, updateStore, currentUser }) {
  const assignments = store.assignments.filter((assignment) => assignment.facultyId === currentUser.id);
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || '');
  const [period, setPeriod] = useState('weekly');
  const assignment = byId(assignments, assignmentId);
  const from = period === 'weekly' ? ago(7) : period === 'monthly' ? ago(30) : store.rules.semesterStart;
  const to = today();
  const rows = assignment ? store.users
    .filter((user) => user.role === 'student' && user.classId === assignment.classId)
    .map((student) => {
      const records = findAttendance(store, { studentId: student.id, classId: assignment.classId, subjectId: assignment.subjectId, from, to });
      const present = records.filter((record) => record.status === 'present').length;
      return { student, present, total: records.length, pct: records.length ? present / records.length * 100 : 0 };
    })
    .sort((a, b) => a.pct - b.pct || a.student.name.localeCompare(b.student.name)) : [];
  const low = rows.filter((row) => row.pct < store.rules.minAttendance);

  const notifyDefaulters = () => {
    if (!low.length) {
      window.alert('No detains.');
      return;
    }
    updateStore((draft) => {
      low.forEach((row) => {
        draft.notifications.push({
          id: uid('note'),
          toUserId: row.student.id,
          fromUserId: currentUser.id,
          createdOn: today(),
          message: `Low attendance in ${subjectLabel(store, assignment.subjectId)}: ${row.pct.toFixed(2)}%.`,
          read: false
        });
      });
    });
      window.alert('Alerts sent to students.');
  };

  const downloadCsv = () => {
    const lines = ['Name,Present,Total,Attendance'];
    rows.forEach((row) => lines.push(`${row.student.name},${row.present},${row.total},${row.pct.toFixed(2)}`));
    downloadFile(`faculty-report-${today()}.csv`, lines.join('\n'), 'text/csv');
  };

  return (
    <section className="section">
      <form className="compact-form two-col" onSubmit={(e) => e.preventDefault()}>
        <label>Assignment<select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>{assignments.map((item) => <option key={item.id} value={item.id}>{className(store, item.classId)} | {subjectLabel(store, item.subjectId)}</option>)}</select></label>
        <label>Report Type<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="semester">Semester</option></select></label>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Present/Total</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row.student.id}><td>{row.student.name}</td><td>{row.present}/{row.total}</td><td>{fmtPct(row.pct)}</td><td><span className={`tag ${getStatusTone(store, row.pct)}`}>{row.pct >= store.rules.minAttendance + 5 ? 'Present' : row.pct >= store.rules.minAttendance ? 'Borderline' : 'Detain'}</span></td></tr>) : <tr><td colSpan="4">No data.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="inline-actions">
        <button type="button" onClick={notifyDefaulters}>Notify Detains ({low.length})</button>
        <button type="button" onClick={downloadCsv}>Download CSV</button>
      </div>
    </section>
  );
}

function StudentDashboard({ store, currentUser, setActiveView }) {
  const summary = studentSummary(store, currentUser.id, { from: store.rules.semesterStart, to: today() });
  const totalClasses = findAttendance(store, { studentId: currentUser.id }).length;

  return (
    <section className="section">
      <div className="grid cols-2">
        <article className="card">
          <h4>Attendance Summary</h4>
          <div className="grid cols-2">
            <div><p className="metric">{totalClasses}</p><p className="metric-sub">Total Classes</p></div>
            <div><p className="metric">{Math.round(summary.overall)}%</p><p className="metric-sub">Present</p></div>
          </div>
          <div className="inline-actions"><button type="button" onClick={() => setActiveView('student-download')}>Download Attendance</button></div>
        </article>
        <article className="card">
          <h4>Quick Links</h4>
          <div className="inline-actions">
            <button type="button" onClick={() => setActiveView('student-view')}>View Attendance</button>
            <button type="button" onClick={() => setActiveView('student-settings')}>Settings</button>
          </div>
          <ul className="list">
            {store.calendar.length ? store.calendar.map((item) => <li key={item.id}><strong>{item.date}</strong> - {item.title}</li>) : <li>No events.</li>}
          </ul>
        </article>
      </div>
    </section>
  );
}

function StudentView({ store, currentUser }) {
  const history = findAttendance(store, { studentId: currentUser.id }).slice().sort((a, b) => (a.date === b.date ? a.timeSlot.localeCompare(b.timeSlot) : b.date.localeCompare(a.date)));

  return (
    <section className="section">
      <div className="table-wrap" style={{ marginTop: 8 }}>
        <table>
          <thead><tr><th>Subject</th><th>Date</th><th>Time Slot</th><th>Status</th><th>Faculty</th></tr></thead>
          <tbody>
            {history.length ? history.map((record) => (
              <tr key={record.id}>
                <td>{subjectLabel(store, record.subjectId)}</td>
                <td>{record.date}</td>
                <td>{record.timeSlot}</td>
                <td><span className={`tag ${record.status === 'present' ? 'ok' : 'bad'}`}>{record.status === 'present' ? 'Present' : 'Absent'}</span></td>
                <td>{userName(store, record.facultyId)}</td>
              </tr>
            )) : <tr><td colSpan="5">No records.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StudentDownload({ store, currentUser }) {
  const summary = studentSummary(store, currentUser.id, { from: store.rules.semesterStart, to: today() });
  const summaryRows = [...summary.bySubject].sort((a, b) => a.pct - b.pct || subjectLabel(store, a.subjectId).localeCompare(subjectLabel(store, b.subjectId)));

  const exportCsv = () => {
    const lines = ['Subject,Present,Total,Attendance'];
    summaryRows.forEach((row) => lines.push(`${subjectLabel(store, row.subjectId)},${row.present},${row.total},${row.pct.toFixed(2)}`));
    downloadFile(`student-attendance-${currentUser.registerNo || currentUser.id}.csv`, lines.join('\n'), 'text/csv');
  };

  return (
    <section className="section">
      <div className="inline-actions">
        <button type="button" onClick={exportCsv}>Download PDF</button>
        <button type="button" onClick={exportCsv}>Download Excel</button>
      </div>
      <article className="card" style={{ marginTop: 10 }}>
        <h4>Attendance Summary</h4>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>Attendance</th></tr></thead>
            <tbody>
              {summaryRows.length ? summaryRows.map((row) => <tr key={row.subjectId}><td>{subjectLabel(store, row.subjectId)}</td><td>{row.present}</td><td>{row.total}</td><td>{fmtPct(row.pct)}</td></tr>) : <tr><td colSpan="4">No summary data.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function PasswordSettingsCard({ store, updateStore, currentUser, title, includeNotifications }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isAlertEnabled, setIsAlertEnabled] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm password must match.');
      return;
    }
    const currentHash = await sha256(currentPassword);
    const user = store.users.find((item) => item.id === currentUser.id);
    if (!user || user.passwordHash !== currentHash) {
      setMessage('Current password is incorrect.');
      return;
    }
    const nextHash = await sha256(newPassword);
    updateStore((draft) => {
      const target = byId(draft.users, currentUser.id);
      if (target) target.passwordHash = nextHash;
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password changed successfully.');
  };

  return (
    <section className="section">
      <div className="grid cols-2">
        <article className="card">
          <h4>{currentUser.role === 'student' ? 'Profile Information' : 'Update Profile'}</h4>
          <form className="compact-form">
            <label>Name<input value={currentUser.name} readOnly /></label>
            {currentUser.role === 'student' ? <label>Student ID<input value={currentUser.registerNo || ''} readOnly /></label> : null}
            <label>Email<input value={currentUser.email} readOnly /></label>
          </form>
        </article>
        <article className="card">
          <h4>{title}</h4>
          <form className="compact-form" onSubmit={handleSubmit}>
            <label>Current Password<input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" required /></label>
            <label>New Password<input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" minLength="4" required /></label>
            <label>Confirm Password<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" minLength="4" required /></label>
            {includeNotifications ? <label><input type="checkbox" checked={isAlertEnabled} onChange={(e) => setIsAlertEnabled(e.target.checked)} /> Receive Attendance Alerts</label> : null}
            <button type="submit">Save Changes</button>
          </form>
          <p className="small form-feedback">{message}</p>
        </article>
      </div>
    </section>
  );
}

function HodDashboard({ store, currentUser }) {
  const students = store.users.filter((user) => user.role === 'student' && user.departmentId === currentUser.departmentId);
  const faculty = store.users.filter((user) => user.role === 'faculty' && user.departmentId === currentUser.departmentId);
  const rows = defaulters(store, { departmentId: currentUser.departmentId, range: { from: store.rules.semesterStart, to: today() } });

  return (
    <>
      <section className="grid cols-3">
        <article className="card"><h3>Department</h3><p className="metric">{deptName(store, currentUser.departmentId)}</p></article>
        <article className="card"><h3>Students</h3><p className="metric">{students.length}</p></article>
        <article className="card"><h3>Faculty</h3><p className="metric">{faculty.length}</p></article>
      </section>
      <section className="section">
        <h3 className="section-title">Detain List</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Roll No.</th><th>Class</th><th>Attendance</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((row) => <tr key={row.student.id}><td>{row.student.name}</td><td>{row.student.registerNo || '-'}</td><td>{className(store, row.student.classId)}</td><td>{fmtPct(row.pct)}</td><td><span className={`tag ${getStatusTone(store, row.pct)}`}>{row.pct >= store.rules.minAttendance + 5 ? 'Present' : row.pct >= store.rules.minAttendance ? 'Borderline' : 'Detain'}</span></td></tr>) : <tr><td colSpan="5">No detains.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function HodStatus({ store, currentUser }) {
  const deptFaculty = store.users.filter((user) => user.role === 'faculty' && user.departmentId === currentUser.departmentId);
  const rows = deptFaculty.map((faculty) => {
    const assignments = store.assignments.filter((assignment) => assignment.facultyId === faculty.id && byId(store.classes, assignment.classId)?.departmentId === currentUser.departmentId);
    const marked = assignments.filter((assignment) => findAttendance(store, { facultyId: faculty.id, classId: assignment.classId, subjectId: assignment.subjectId, date: today() }).length > 0).length;
    return { faculty, classes: assignments.length, marked };
  });

  return (
    <section className="section">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Faculty</th><th>Classes</th><th>Marked Today</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row.faculty.id}><td>{row.faculty.name}</td><td>{row.classes}</td><td>{row.marked}</td><td><span className={`tag ${row.marked === row.classes ? 'ok' : 'warn'}`}>{row.marked === row.classes ? 'Completed' : 'Pending'}</span></td></tr>) : <tr><td colSpan="4">No faculty records.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HodReports({ store, currentUser }) {
  const rows = store.users
    .filter((user) => user.role === 'student' && user.departmentId === currentUser.departmentId)
    .map((student) => ({
      student,
      pct: studentSummary(store, student.id, { from: store.rules.semesterStart, to: today() }).overall
    }))
    .sort((a, b) => a.pct - b.pct || a.student.name.localeCompare(b.student.name));

  const downloadCsv = () => {
    const lines = ['Name,Roll No,Class,Attendance'];
    rows.forEach((row) => lines.push(`${row.student.name},${row.student.registerNo || '-'},${className(store, row.student.classId)},${row.pct.toFixed(2)}`));
    downloadFile(`department-report-${today()}.csv`, lines.join('\n'), 'text/csv');
  };

  return (
    <section className="section">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Roll No.</th><th>Class</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row.student.id}><td>{row.student.name}</td><td>{row.student.registerNo || '-'}</td><td>{className(store, row.student.classId)}</td><td>{fmtPct(row.pct)}</td><td><span className={`tag ${getStatusTone(store, row.pct)}`}>{row.pct >= store.rules.minAttendance + 5 ? 'Present' : row.pct >= store.rules.minAttendance ? 'Borderline' : 'Detain'}</span></td></tr>) : <tr><td colSpan="5">No data.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="inline-actions"><button type="button" onClick={downloadCsv}>Download CSV</button></div>
    </section>
  );
}

function HodSettings({ store, currentUser }) {
  return (
    <section className="section">
      <div className="grid cols-2">
        <article className="card">
          <h4>Department Profile</h4>
          <form className="compact-form">
            <label>Name<input value={currentUser.name} readOnly /></label>
            <label>Department<input value={deptName(store, currentUser.departmentId)} readOnly /></label>
            <label>Email<input value={currentUser.email} readOnly /></label>
          </form>
        </article>
        <article className="card">
          <h4>Attendance Policy</h4>
          <p className="notice">Minimum attendance is {store.rules.minAttendance}% and faculty can edit attendance for {store.rules.allowEditPastDays} days.</p>
        </article>
      </div>
    </section>
  );
}

export default App;
