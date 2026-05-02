export const STORAGE_KEY = 'sams-store-v2';
export const SESSION_KEY = 'sams-session-v2';
const API_BASE = '/api';

export const PASS = {
  admin: 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7',
  faculty: '9859bcef2187144a16f11447b17129443780817a119496650b96bf354a65739e',
  student: 'b2a1f4fd0a460606b34c8913e2981dac8d2e283d778aba586c416ee2629bfa54',
  hod: 'd5b36b6b9e74623114988049ea145a20dddacf2e193575c2a7799bf267789dad'
};

export const ROLE_TITLE = { admin: 'Admin', faculty: 'Faculty', student: 'Student', hod: 'HOD' };

export const NAV = {
  admin: [
    { id: 'admin-dashboard', label: 'Dashboard', icon: '[D]' },
    { id: 'admin-users', label: 'Manage Users', icon: '[U]' },
    { id: 'admin-departments', label: 'Add Department', icon: '[A]' },
    { id: 'admin-reports', label: 'Attendance Reports', icon: '[R]' },
    { id: 'admin-settings', label: 'Settings', icon: '[S]' }
  ],
  faculty: [
    { id: 'faculty-dashboard', label: 'Dashboard', icon: '[D]' },
    { id: 'faculty-mark', label: 'Mark Attendance', icon: '[M]' },
    { id: 'faculty-view', label: 'View Attendance', icon: '[V]' },
    { id: 'faculty-reports', label: 'Generate Reports', icon: '[G]' },
    { id: 'faculty-settings', label: 'Settings', icon: '[S]' }
  ],
  student: [
    { id: 'student-dashboard', label: 'Dashboard', icon: '[D]' },
    { id: 'student-view', label: 'View Attendance', icon: '[V]' },
    { id: 'student-download', label: 'Download Report', icon: '[R]' },
    { id: 'student-settings', label: 'Settings', icon: '[S]' }
  ],
  hod: [
    { id: 'hod-dashboard', label: 'Dashboard', icon: '[D]' },
    { id: 'hod-status', label: 'Faculty Status', icon: '[F]' },
    { id: 'hod-courses', label: 'Manage Subjects', icon: '[C]' },
    { id: 'hod-reports', label: 'Department Reports', icon: '[R]' },
    { id: 'hod-settings', label: 'Settings', icon: '[S]' }
  ]
};

export const TIME_SLOTS = ['Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5', 'Hour 6'];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ago(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function requiredClasses() {
  return [
    { id: 'class-cse-1', name: 'CSE 1st', semester: 2, departmentId: 'dep-cse' },
    { id: 'class-cse-a', name: 'CSE 2nd', semester: 4, departmentId: 'dep-cse' },
    { id: 'class-cse-b', name: 'CSE 3rd', semester: 6, departmentId: 'dep-cse' },
    { id: 'class-cse-4', name: 'CSE 4th', semester: 8, departmentId: 'dep-cse' },
    { id: 'class-ece-1', name: 'ECE 1st', semester: 2, departmentId: 'dep-ece' },
    { id: 'class-ece-a', name: 'ECE 2nd', semester: 4, departmentId: 'dep-ece' },
    { id: 'class-ece-3', name: 'ECE 3rd', semester: 6, departmentId: 'dep-ece' },
    { id: 'class-ece-4', name: 'ECE 4th', semester: 8, departmentId: 'dep-ece' },
    { id: 'class-eee-1', name: 'EEE 1st', semester: 2, departmentId: 'dep-eee' },
    { id: 'class-eee-2', name: 'EEE 2nd', semester: 4, departmentId: 'dep-eee' },
    { id: 'class-eee-3', name: 'EEE 3rd', semester: 6, departmentId: 'dep-eee' },
    { id: 'class-eee-4', name: 'EEE 4th', semester: 8, departmentId: 'dep-eee' },
    { id: 'class-ce-1', name: 'CE 1st', semester: 2, departmentId: 'dep-civil' },
    { id: 'class-ce-2', name: 'CE 2nd', semester: 4, departmentId: 'dep-civil' },
    { id: 'class-ce-3', name: 'CE 3rd', semester: 6, departmentId: 'dep-civil' },
    { id: 'class-ce-4', name: 'CE 4th', semester: 8, departmentId: 'dep-civil' },
    { id: 'class-me-1', name: 'ME 1st', semester: 2, departmentId: 'dep-mech' },
    { id: 'class-me-2', name: 'ME 2nd', semester: 4, departmentId: 'dep-mech' },
    { id: 'class-me-3', name: 'ME 3rd', semester: 6, departmentId: 'dep-mech' },
    { id: 'class-me-4', name: 'ME 4th', semester: 8, departmentId: 'dep-mech' }
  ];
}

export function emailFromRegisterNo(registerNo, fallbackLocalPart) {
  const reg = String(registerNo || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const fallback = String(fallbackLocalPart || 'student').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'student';
  return `${reg || fallback}@vemu.org`;
}

export function facultyEmailFromNumber(number) {
  return `${String(number).padStart(5, '0')}@vemu.org`;
}

export function nextFacultyEmail(users) {
  const nextNumber = (users || [])
    .filter((user) => user.role === 'faculty')
    .map((user) => {
      const match = String(user.email || '').trim().toLowerCase().match(/^(\d+)@vemu\.org$/);
      return match ? Number(match[1]) : 0;
    })
    .reduce((max, value) => Math.max(max, value), 0) + 1;

  return facultyEmailFromNumber(nextNumber);
}

export function buildSeed() {
  const seed = {
    rules: {
      minAttendance: 75,
      allowEditPastDays: 5,
      semesterStart: '2026-01-10',
      semesterEnd: '2026-05-30'
    },
    departments: [
      { id: 'dep-cse', name: 'Computer Science and Engineering' },
      { id: 'dep-ece', name: 'Electronics and Communication Engineering' },
      { id: 'dep-eee', name: 'Electrical and Electronics Engineering' },
      { id: 'dep-mech', name: 'Mechanical Engineering' },
      { id: 'dep-civil', name: 'Civil Engineering' }
    ],
    classes: requiredClasses(),
    subjects: [
      { id: 'sub-dbms', code: 'CS601', name: 'Database Management', departmentId: 'dep-cse' },
      { id: 'sub-se', code: 'CS602', name: 'Software Engineering', departmentId: 'dep-cse' },
      { id: 'sub-dsp', code: 'EC601', name: 'Digital Signal Processing', departmentId: 'dep-ece' }
    ],
    users: [
      { id: 'u-admin', role: 'admin', name: 'System Admin', email: 'admin@vemu.org', passwordHash: PASS.admin, departmentId: null, classId: null, registerNo: null },
      { id: 'u-hod', role: 'hod', name: 'Dr. Neha Raman', email: 'nirupama@vemu.org', passwordHash: PASS.hod, departmentId: 'dep-cse', classId: null, registerNo: null },
      { id: 'u-f1', role: 'faculty', name: 'Lakshmi Prasad', email: '00001@vemu.org', passwordHash: PASS.faculty, departmentId: 'dep-cse', classId: null, registerNo: null },
      { id: 'u-f2', role: 'faculty', name: 'Harikrishna', email: '00002@vemu.org', passwordHash: PASS.faculty, departmentId: 'dep-cse', classId: null, registerNo: null },
      { id: 'u-f3', role: 'faculty', name: 'Bharathi', email: '00003@vemu.org', passwordHash: PASS.faculty, departmentId: 'dep-ece', classId: null, registerNo: null },
      { id: 'u-sr1', role: 'student', name: 'B.Rakesh', email: '244m1a0567@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0567' },
      { id: 'u-sr2', role: 'student', name: 'C.Sandhya', email: '244m1a0568@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0568' },
      { id: 'u-sr3', role: 'student', name: 'D.Chaithra', email: '244m1a0570@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0570' }
    ],
    assignments: [
      { id: 'as1', facultyId: 'u-f1', classId: 'class-cse-a', subjectId: 'sub-dbms' },
      { id: 'as2', facultyId: 'u-f2', classId: 'class-cse-a', subjectId: 'sub-se' },
      { id: 'as3', facultyId: 'u-f1', classId: 'class-cse-b', subjectId: 'sub-dbms' },
      { id: 'as4', facultyId: 'u-f2', classId: 'class-cse-b', subjectId: 'sub-se' },
      { id: 'as5', facultyId: 'u-f3', classId: 'class-ece-a', subjectId: 'sub-dsp' }
    ],
    calendar: [
      { id: 'cal1', date: '2026-03-15', title: 'Internal Assessment I' },
      { id: 'cal2', date: '2026-04-07', title: 'Project Review' }
    ],
    notifications: [
      { id: uid('note'), toUserId: 'u-sr2', fromUserId: 'u-f1', createdOn: today(), message: 'Low attendance alert in Database Management.', read: false }
    ],
    attendance: []
  };

  for (let d = 10; d >= 1; d -= 1) {
    const date = ago(d);
    for (const assignment of seed.assignments) {
      const students = seed.users.filter((user) => user.role === 'student' && user.classId === assignment.classId);
      students.forEach((student, index) => {
        const absent = (d + index + assignment.subjectId.length) % 8 === 0;
        seed.attendance.push({
          id: uid('att'),
          date,
          timeSlot: TIME_SLOTS[d % TIME_SLOTS.length],
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          facultyId: assignment.facultyId,
          studentId: student.id,
          status: absent ? 'absent' : 'present',
          updatedAt: new Date().toISOString()
        });
      });
    }
  }

  return seed;
}

export function byId(arr, id) {
  return (arr || []).find((item) => item.id === id);
}

export function percent(records) {
  if (!records.length) return 0;
  const present = records.filter((record) => record.status === 'present').length;
  return (present / records.length) * 100;
}

export function fmtPct(value) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
}

export function getStatusTone(store, value) {
  if (value >= store.rules.minAttendance + 5) return 'ok';
  if (value >= store.rules.minAttendance) return 'warn';
  return 'bad';
}

export function className(store, id) {
  return byId(store.classes, id)?.name || '-';
}

export function deptName(store, id) {
  return byId(store.departments, id)?.name || '-';
}

export function departmentCode(department) {
  if (!department) return '-';
  const idMap = {
    'dep-cse': 'CSE',
    'dep-ece': 'ECE',
    'dep-eee': 'EEE',
    'dep-civil': 'CE',
    'dep-mech': 'ME'
  };
  if (idMap[department.id]) return idMap[department.id];
  const words = String(department.name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return String(department.id || '-').replace(/^dep-/, '').toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((word) => word[0]).join('').slice(0, 4).toUpperCase();
}

export function subjectLabel(store, id) {
  const subject = byId(store.subjects, id);
  return subject ? `${subject.code} - ${subject.name}` : '-';
}

export function userName(store, id) {
  return byId(store.users, id)?.name || '-';
}

export function findAttendance(store, filter = {}) {
  return store.attendance.filter((record) => {
    if (filter.studentId && record.studentId !== filter.studentId) return false;
    if (filter.classId && record.classId !== filter.classId) return false;
    if (filter.subjectId && record.subjectId !== filter.subjectId) return false;
    if (filter.facultyId && record.facultyId !== filter.facultyId) return false;
    if (filter.date && record.date !== filter.date) return false;
    if (filter.timeSlot && record.timeSlot !== filter.timeSlot) return false;
    if (filter.from && record.date < filter.from) return false;
    if (filter.to && record.date > filter.to) return false;
    return true;
  });
}

export function studentSummary(store, studentId, range = {}) {
  const student = byId(store.users, studentId);
  if (!student) return { overall: 0, bySubject: [] };
  const assignments = store.assignments.filter((assignment) => assignment.classId === student.classId);
  const bySubject = assignments.map((assignment) => {
    const records = findAttendance(store, { studentId, subjectId: assignment.subjectId, from: range.from, to: range.to });
    return {
      subjectId: assignment.subjectId,
      present: records.filter((record) => record.status === 'present').length,
      total: records.length,
      pct: percent(records)
    };
  });
  const all = findAttendance(store, { studentId, from: range.from, to: range.to });
  return { overall: percent(all), bySubject };
}

export function defaulters(store, filter = {}) {
  return store.users
    .filter((user) => {
      if (user.role !== 'student') return false;
      if (filter.departmentId && user.departmentId !== filter.departmentId) return false;
      if (filter.classId && user.classId !== filter.classId) return false;
      return true;
    })
    .map((student) => ({ student, pct: studentSummary(store, student.id, filter.range || {}).overall }))
    .filter((item) => item.pct < store.rules.minAttendance)
    .sort((a, b) => a.pct - b.pct);
}

export function downloadFile(name, data, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (_error) {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function sha256(text) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function fetchStore() {
  const response = await fetch(`${API_BASE}/store`);
  if (!response.ok) {
    throw new Error('Failed to load store from server.');
  }
  const payload = await response.json();
  return applyMigrations(payload.store);
}

export async function persistStore(store) {
  const response = await fetch(`${API_BASE}/store`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store })
  });
  if (!response.ok) {
    throw new Error('Failed to save store to server.');
  }
  const payload = await response.json();
  return applyMigrations(payload.store);
}

export async function resetStoreRemote() {
  const response = await fetch(`${API_BASE}/store/reset`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to reset store on server.');
  }
  const payload = await response.json();
  return applyMigrations(payload.store);
}

export function prepareStore(input) {
  return applyMigrations(input);
}

export function initializeLocalStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let store;

  if (!raw) {
    store = buildSeed();
  } else {
    try {
      store = JSON.parse(raw);
      if (!store.users || !store.attendance || !store.assignments) throw new Error('invalid');
    } catch (_error) {
      store = buildSeed();
    }
  }

  const next = applyMigrations(store);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function persistStoreLocal(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applyMigrations(store)));
}

function applyMigrations(input) {
  const store = clone(input);

  const defaultHod = store.users.find((user) => user.id === 'u-hod' && user.role === 'hod');
  if (defaultHod) {
    defaultHod.email = 'nirupama@vemu.org';
    if (!defaultHod.passwordHash) defaultHod.passwordHash = PASS.hod;
  }

  const requiredDepartments = [
    { id: 'dep-eee', name: 'Electrical and Electronics Engineering' },
    { id: 'dep-civil', name: 'Civil Engineering' },
    { id: 'dep-mech', name: 'Mechanical Engineering' }
  ];
  requiredDepartments.forEach((department) => {
    const existing = store.departments.find((item) => item.id === department.id);
    if (!existing) store.departments.push(department);
    else existing.name = department.name;
  });

  const classes = requiredClasses();
  const orderedIds = classes.map((item) => item.id);
  classes.forEach((cls) => {
    const existing = store.classes.find((item) => item.id === cls.id);
    if (!existing) {
      store.classes.push({ ...cls });
      return;
    }
    existing.name = cls.name;
    existing.semester = cls.semester;
    existing.departmentId = cls.departmentId;
  });
  store.classes = [
    ...classes.map((cls) => store.classes.find((item) => item.id === cls.id)).filter(Boolean),
    ...store.classes.filter((cls) => !orderedIds.includes(cls.id))
  ];

  const requiredFaculty = [
    { id: 'u-f1', name: 'Lakshmi Prasad', email: '00001@vemu.org', departmentId: 'dep-cse' },
    { id: 'u-f2', name: 'Harikrishna', email: '00002@vemu.org', departmentId: 'dep-cse' },
    { id: 'u-f3', name: 'Bharathi', email: '00003@vemu.org', departmentId: 'dep-ece' }
  ];
  const requiredIds = new Set(requiredFaculty.map((faculty) => faculty.id));
  const legacyNames = new Set(['Professor Clark', 'Professor Emily', 'Professor Rahul']);
  requiredFaculty.forEach((faculty) => {
    const existing = store.users.find((user) => user.id === faculty.id);
    if (!existing) {
      store.users.push({
        id: faculty.id,
        role: 'faculty',
        name: faculty.name,
        email: faculty.email,
        passwordHash: PASS.faculty,
        departmentId: faculty.departmentId,
        classId: null,
        registerNo: null
      });
      return;
    }
    existing.role = 'faculty';
    existing.name = faculty.name;
    if (!existing.email) existing.email = faculty.email;
    existing.departmentId = faculty.departmentId;
    existing.classId = null;
    existing.registerNo = null;
    if (!existing.passwordHash) existing.passwordHash = PASS.faculty;
  });
  store.users = store.users.filter((user) => !(user.role === 'faculty' && legacyNames.has(user.name) && !requiredIds.has(user.id)));

  const requiredStudents = [
    { id: 'u-sr1', role: 'student', name: 'B.Rakesh', email: '244m1a0567@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0567' },
    { id: 'u-sr2', role: 'student', name: 'C.Sandhya', email: '244m1a0568@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0568' },
    { id: 'u-sr3', role: 'student', name: 'D.Chaithra', email: '244m1a0570@vemu.org', passwordHash: PASS.student, departmentId: 'dep-cse', classId: 'class-cse-a', registerNo: '244M1A0570' }
  ];
  requiredStudents.forEach((student) => {
    const existing = store.users.find((user) => user.id === student.id);
    if (!existing) {
      store.users.push({ ...student });
      return;
    }
    existing.role = 'student';
    existing.name = student.name;
    existing.email = student.email;
    existing.departmentId = student.departmentId;
    existing.classId = student.classId;
    existing.registerNo = student.registerNo;
    if (!existing.passwordHash) existing.passwordHash = PASS.student;
  });

  store.users
    .filter((user) => user.role === 'student')
    .forEach((student) => {
      student.email = emailFromRegisterNo(student.registerNo, student.id);
    });

  store.users
    .filter((user) => user.role === 'faculty')
    .forEach((faculty, index) => {
      if (!faculty.email) {
        faculty.email = facultyEmailFromNumber(index + 1);
      }
    });

  store.users
    .filter((user) => !['faculty', 'student'].includes(user.role))
    .forEach((user) => {
      const rawEmail = String(user.email || '').trim().toLowerCase();
      const localPart = (rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail || user.id || 'user').replace(/[^a-z0-9._-]/g, '');
      user.email = `${localPart || 'user'}@vemu.org`;
    });

  return store;
}
