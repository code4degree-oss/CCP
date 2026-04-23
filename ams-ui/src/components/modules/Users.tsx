'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, UserCheck, Loader2, X, Trash2, Pencil, Shield, Copy, KeyRound } from 'lucide-react'
import { Card, Button, Table } from '@/components/ui'
import { usersApi, rolesApi, branchesApi } from '@/lib/api'

interface UserRow {
  id: number; full_name: string; email: string; mobile: string; role: number | null; role_name: string | null; manager: number | null; assigned_by_name: string | null; branch_id: number | null; branch_name: string | null; is_active: boolean; is_staff: boolean; created_at: string
}

export function UsersModule() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', password: '', role: '', branch_id: '', is_active: true })
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null)
  const [copied, setCopied] = useState(false)
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ams_user') || '{}') : {}
  const isSuper = currentUser.is_superuser || currentUser.role === 'Super Admin'
  
  // Filter roles to prevent creating Super Admins
  const availableRoles = roles.filter(r => !r.name.toLowerCase().includes('super'))

  const load = async () => {
    setLoading(true)
    try {
      const qs = isSuper ? '' : `?branch_id=${currentUser.branch_id || ''}`
      const [u, r, b] = await Promise.all([usersApi.list(qs), rolesApi.list(), branchesApi.list()])
      setUsers(u); setRoles(r); setBranches(b)
    } catch { setError('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditId(null)
    setForm({ full_name: '', email: '', mobile: '', password: '', role: '', branch_id: isSuper ? '' : currentUser.branch_id?.toString() || '', is_active: true })
    setShowForm(true); setError('')
  }

  const openEdit = (u: UserRow) => {
    setEditId(u.id)
    setForm({ full_name: u.full_name, email: u.email, mobile: u.mobile, password: '', role: u.role?.toString() || '', branch_id: u.branch_id?.toString() || '', is_active: u.is_active })
    setShowForm(true); setError('')
  }

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.mobile) { setError('Name, Email, and Mobile are required'); return }
    setSaving(true); setError('')
    try {
      const payload: any = {
        full_name: form.full_name,
        email: form.email,
        mobile: form.mobile,
        role: form.role ? Number(form.role) : null,
        is_active: form.is_active,
      }
      if (!editId) {
        payload.manager = currentUser.id
        payload.branch_id = isSuper ? (form.branch_id ? Number(form.branch_id) : null) : currentUser.branch_id
      }
      if (form.password) payload.password = form.password
      if (editId) {
        await usersApi.update(editId, payload)
        setShowForm(false)
      } else {
        const res = await usersApi.create(payload)
        setShowForm(false)
        if (res && res.generated_password) {
          setCreatedCredentials({ email: form.email, password: res.generated_password })
        }
      }
      await load()
    } catch (e: any) { setError(e.message || 'Save failed') }
    setSaving(false)
  }

  const handleSuspend = async (id: number) => {
    if (confirm('Are you sure you want to suspend this user?')) {
      setLoading(true)
      try {
        await usersApi.suspend(id)
        await load()
      } catch(e: any) { setError('Failed to suspend') }
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to completely delete this user? This cannot be undone.')) {
      setLoading(true)
      try {
        await usersApi.remove(id)
        await load()
      } catch(e: any) { setError('Failed to delete') }
      setLoading(false)
    }
  }

  const handleResetPassword = async (u: UserRow) => {
    if (!confirm(`Reset password for ${u.full_name}? This will generate a new temporary password and they will be forced to change it on next login.`)) return
    setLoading(true)
    try {
      const res = await usersApi.resetPassword(u.id)
      setCreatedCredentials({ email: u.email, password: res.temporary_password })
    } catch (e: any) { setError(e.message || 'Failed to reset password') }
    setLoading(false)
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search)
  )

  const roleBadge = (name: string | null) => {
    if (!name) return 'bg-bg-hover text-txt-muted border-bg-border'
    if (name.toLowerCase().includes('super')) return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
    if (name.toLowerCase().includes('admin')) return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
    return 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
  }

  const inputCls = 'w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40 transition-colors'
  const labelCls = 'text-[11px] text-txt-muted block mb-1 font-medium'

  const columns = [
    { key: 'full_name', label: 'Name', render: (r: UserRow) => (
      <div 
        className="flex items-center gap-2.5 cursor-pointer hover:bg-bg-hover p-1 -ml-1 rounded transition-colors"
        onClick={() => openEdit(r)}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple/30 to-accent-blue/30 flex items-center justify-center text-[11px] font-semibold text-txt-primary shrink-0">
          {r.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <div className="font-medium text-accent-blue text-xs hover:underline">{r.full_name}</div>
          <div className="text-[10px] text-txt-muted">{r.email}</div>
        </div>
      </div>
    )},
    { key: 'mobile', label: 'Mobile', render: (r: UserRow) => <span className="font-mono text-[11px] text-txt-secondary">{r.mobile}</span> },
    { key: 'role', label: 'Designation', render: (r: UserRow) => <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${roleBadge(r.role_name)}`}>{r.role_name || 'No Role'}</span> },
    { key: 'branch', label: 'Branch', render: (r: UserRow) => <span className="text-[11px] text-txt-secondary">{r.branch_name || '—'}</span> },
    { key: 'created_by', label: 'Created By', render: (r: UserRow) => (
      <div>
        <div className="text-[11px] text-txt-primary">{r.assigned_by_name || 'System'}</div>
        <div className="text-[9px] text-txt-muted">{new Date(r.created_at).toLocaleDateString('en-GB')}</div>
      </div>
    )},
    { key: 'status', label: 'Status', render: (r: UserRow) => r.is_active
      ? <span className="text-[11px] text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded font-medium">Active</span>
      : <span className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded font-medium">Inactive</span>
    },
    { key: 'actions', label: '', render: (r: UserRow) => (
      <div className="flex bg-transparent items-center gap-1 justify-end">
        <button onClick={(e) => { e.stopPropagation(); handleResetPassword(r) }} className="p-1.5 rounded hover:bg-bg-hover text-accent-blue transition-colors" title="Reset Password">
          <KeyRound size={12} />
        </button>
        {r.is_active && !isSuper && (
           <button onClick={(e) => { e.stopPropagation(); handleSuspend(r.id) }} className="p-1.5 rounded hover:bg-bg-hover text-amber-500 transition-colors" title="Suspend"><Shield size={12} /></button>
        )}
        {isSuper && (
           <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }} className="p-1.5 rounded hover:bg-bg-hover text-red-500 transition-colors" title="Delete"><Trash2 size={12} /></button>
        )}
        <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="Edit"><Pencil size={12} className="text-txt-muted" /></button>
      </div>
    )},
  ]

  // DEDICATED FORM VIEW
  if (showForm) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-txt-primary">{editId ? 'Edit User / Employee' : 'Add New User / Employee'}</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
            <X size={14} className="mr-1" /> Close
          </Button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input 
                value={form.full_name} 
                onChange={e => set('full_name', e.target.value)} 
                className={`${inputCls} ${editId ? 'bg-bg-hover opacity-70 cursor-not-allowed' : ''}`} 
                placeholder="John Doe" 
                disabled={!!editId}
              />
              {!!editId && <p className="text-[10px] text-txt-muted mt-1">Name cannot be changed after creation.</p>}
            </div>
            
            <div>
              <label className={labelCls}>Email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="user@chanakya.com" />
            </div>
            
            <div>
              <label className={labelCls}>Mobile *</label>
              <input value={form.mobile} onChange={e => set('mobile', e.target.value)} className={inputCls} placeholder="9876543210" />
            </div>
            
            {!!editId && (
              <div>
                <label className={labelCls}>New Password (leave blank to keep)</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
            )}
            
            <div>
              <label className={labelCls}>Role / Designation</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls}>
                <option value="">— No Role —</option>
                {availableRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            {isSuper && (!editId || form.branch_id) && (
              <div>
                <label className={labelCls}>Assign to Branch</label>
                <select value={form.branch_id} onChange={e => set('branch_id', e.target.value)} className={inputCls} disabled={!!editId}>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="md:col-span-2 flex items-center gap-2 mt-2 bg-bg-base p-3 rounded-lg border border-bg-border">
              <input type="checkbox" id="user-active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-accent-blue transform scale-110" />
              <div>
                <label htmlFor="user-active" className="text-sm font-medium text-txt-primary cursor-pointer block leading-none">Active Account</label>
                <span className="text-[10px] text-txt-muted">Inactive users cannot log into the system</span>
              </div>
            </div>
          </div>
          
          {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 mt-4 rounded">{error}</div>}
          
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-bg-border">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} className="px-6">
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {editId ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // LIST VIEW

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Users / Employees</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">{users.length} total users</p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew}><Plus size={12} />Add User</Button>
      </div>

      <div className="relative w-72">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, mobile…" className="w-full bg-bg-card border border-bg-border rounded pl-8 pr-4 py-1.5 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-blue/40 transition-colors" />
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : (
        <Card>
          {users.length > 0 ? (
            <Table columns={columns} data={filtered} keyField="id" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserCheck size={24} className="text-txt-muted mb-3" />
              <h4 className="text-sm font-medium text-txt-secondary">No users yet</h4>
              <p className="text-xs text-txt-muted mt-1">Click &quot;Add User&quot; to create your first user.</p>
            </div>
          )}
        </Card>
      )}

      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-bg-border rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in relative text-center">
            <h3 className="text-lg font-semibold text-accent-green mb-2">User Created</h3>
            <p className="text-xs text-txt-muted mb-4">Please securely copy these credentials for the new user.</p>
            
            <div className="bg-bg-base border border-bg-border rounded-lg p-3 text-left space-y-2 mb-4">
              <div>
                <span className="text-[10px] uppercase text-txt-muted font-bold tracking-wider">Email</span>
                <div className="text-sm font-mono text-txt-primary">{createdCredentials.email}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-txt-muted font-bold tracking-wider">Password</span>
                <div className="text-sm font-mono text-txt-primary">{createdCredentials.password}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Copy size={14} className="mr-2" />
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
              <Button variant="secondary" onClick={() => setCreatedCredentials(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
