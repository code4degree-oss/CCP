const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/api'
  : 'http://localhost:8000/api'

export async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}/`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || JSON.stringify(err))
  }
  if (res.status === 204) return null as T
  return res.json()
}

// ---------- AUTH ----------
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch('login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => apiFetch('me'),
  logout: () => apiFetch('logout', { method: 'POST' }),
  changePassword: (userId: number, newPassword: string, confirmPassword: string) =>
    apiFetch('change-password', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, new_password: newPassword, confirm_password: confirmPassword }),
    }),
}

// ---------- BRANCHES ----------
export const branchesApi = {
  list: () => apiFetch('branches'),
  get: (id: number) => apiFetch(`branches/${id}`),
  create: (data: any) => apiFetch('branches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`branches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`branches/${id}`, { method: 'DELETE' }),
}

// ---------- BRANCH COURSES ----------
export const branchCoursesApi = {
  list: (branchId?: number) => apiFetch(`branch-courses${branchId ? `?branch=${branchId}` : ''}`),
  create: (data: any) => apiFetch('branch-courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`branch-courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`branch-courses/${id}`, { method: 'DELETE' }),
}

// ---------- ORGANIZATIONS ----------
export const orgsApi = {
  list: () => apiFetch('organizations'),
  get: (id: number) => apiFetch(`organizations/${id}`),
  create: (data: any) => apiFetch('organizations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ---------- STUDENTS ----------
export const studentsApi = {
  list: () => apiFetch('students'),
  get: (id: number) => apiFetch(`students/${id}`),
  create: (data: any) => apiFetch('students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`students/${id}`, { method: 'DELETE' }),
}

// ---------- ENQUIRIES ----------
export const enquiriesApi = {
  list: (qs?: string) => apiFetch(`enquiries${qs || ''}`),
  create: (data: any) => apiFetch('enquiries', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`enquiries/${id}`, { method: 'DELETE' }),
}

// ---------- ADMISSIONS ----------
export const admissionsApi = {
  list: (qs?: string) => apiFetch(`admissions${qs || ''}`),
  get: (id: number) => apiFetch(`admissions/${id}`),
  create: (data: any) => apiFetch('admissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`admissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  initiate: (data: any) => apiFetch('admissions/initiate', { method: 'POST', body: JSON.stringify(data) }),
  completeProfile: (id: number, data: any) => apiFetch(`admissions/${id}/complete-profile`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ---------- STREAMS / COURSES / COLLEGES ----------
export const streamsApi = {
  list: () => apiFetch('streams'),
  create: (data: any) => apiFetch('streams', { method: 'POST', body: JSON.stringify(data) }),
}
export const coursesApi = {
  list: () => apiFetch('courses'),
  create: (data: any) => apiFetch('courses', { method: 'POST', body: JSON.stringify(data) }),
}
export const collegesApi = {
  list: () => apiFetch('colleges'),
  create: (data: any) => apiFetch('colleges', { method: 'POST', body: JSON.stringify(data) }),
}

// ---------- USERS & ROLES ----------
export const usersApi = {
  list: (qs?: string) => apiFetch(`users${qs ? qs : ''}`),
  get: (id: number) => apiFetch(`users/${id}`),
  create: (data: any) => apiFetch('users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`users/${id}`, { method: 'DELETE' }),
  suspend: (id: number) => apiFetch(`users/${id}/suspend`, { method: 'POST' }),
}
export const rolesApi = {
  list: () => apiFetch('roles'),
  create: (data: any) => apiFetch('roles', { method: 'POST', body: JSON.stringify(data) }),
}

// ---------- FEES ----------
export const feesApi = {
  list: () => apiFetch('branch-fee-configs'),
  create: (data: any) => apiFetch('branch-fee-configs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`branch-fee-configs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ---------- PAYMENTS ----------
export const paymentsApi = {
  list: () => apiFetch('payments'),
  create: (data: any) => apiFetch('payments', { method: 'POST', body: JSON.stringify(data) }),
}

