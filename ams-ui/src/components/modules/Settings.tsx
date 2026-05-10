'use client'

import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, HardDrive, Server, Activity, RefreshCw, Database, Users, GraduationCap, CreditCard, BookOpen, Globe } from 'lucide-react'

interface SystemStats {
  os: string
  python: string
  service_status: string
  cpu_percent: number | null
  cpu_count: number | null
  memory_total_gb: number | null
  memory_used_gb: number | null
  memory_percent: number | null
  disk_total_gb: number | null
  disk_used_gb: number | null
  disk_percent: number | null
  net_sent_gb: number | null
  net_recv_gb: number | null
  total_admissions: number
  total_students: number
  total_payments: number
  total_enquiries: number
  note?: string
}

import { systemApi } from '@/lib/api'

export function SettingsModule() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastSync, setLastSync] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = async () => {
    setRefreshing(true)
    try {
      const data = await systemApi.stats()
      setStats(data)
      setLastSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
      setError('')
    } catch (e: any) {
      setError(e.message || 'Failed to fetch system stats')
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadStats() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={loadStats} className="mt-4 text-sm text-blue-600 underline">Retry</button>
      </div>
    )
  }

  const cpuPercent = stats?.cpu_percent ?? 0
  const memPercent = stats?.memory_percent ?? 0
  const diskPercent = stats?.disk_percent ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">System Configuration</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Server health monitoring & database overview</p>
        </div>
        <button
          onClick={loadStats}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* Host Environment */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Server size={18} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Host Environment</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Last Sync</p>
            <p className="text-xs font-medium text-gray-700">{lastSync}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Operating System</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{stats?.os || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Runtime Environment</p>
            <p className="text-sm font-bold text-gray-900 mt-1">Python {stats?.python || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Service Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">{stats?.service_status || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Cpu size={16} className="text-blue-600" />
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">CPU Processing</p>
          </div>
          <div className="mb-3">
            <span className="text-3xl font-black text-gray-900">{cpuPercent != null ? cpuPercent.toFixed(1) : '—'}%</span>
            <span className="text-xs font-semibold text-gray-400 ml-2">LOAD</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-blue-600"
              style={{ width: `${Math.min(cpuPercent || 0, 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase">Cores Configured <span className="text-gray-700 ml-2">{stats?.cpu_count ?? '—'} vCPU</span></p>
        </div>

        {/* Memory */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <MemoryStick size={16} className="text-purple-600" />
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Memory</p>
          </div>
          <div className="mb-3">
            <span className="text-3xl font-black text-gray-900">{memPercent != null ? memPercent.toFixed(1) : '—'}%</span>
            <span className="text-xs font-semibold text-gray-400 ml-2">UTILIZED</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-400 to-purple-600"
              style={{ width: `${Math.min(memPercent || 0, 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">
            {stats?.memory_used_gb ?? '—'} GB / {stats?.memory_total_gb ?? '—'} GB
          </p>
        </div>

        {/* Disk */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <HardDrive size={16} className="text-rose-600" />
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Host Storage</p>
          </div>
          <div className="mb-3">
            <span className="text-3xl font-black text-gray-900">{diskPercent != null ? diskPercent.toFixed(1) : '—'}%</span>
            <span className="text-xs font-semibold text-gray-400 ml-2">FILLED</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-400 to-rose-600"
              style={{ width: `${Math.min(diskPercent || 0, 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-gray-400">
            {stats?.disk_used_gb ?? '—'} GB / {stats?.disk_total_gb ?? '—'} GB
          </p>
        </div>

        {/* Network */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Globe size={16} className="text-emerald-600" />
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Network Traffic</p>
          </div>
          <div className="mb-3">
            <span className="text-3xl font-black text-gray-900">{stats?.net_sent_gb != null ? ((stats.net_sent_gb || 0) + (stats.net_recv_gb || 0)).toFixed(1) : '—'}</span>
            <span className="text-xs font-semibold text-gray-400 ml-2">GB USED</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3 flex">
            {/* Split bar: 50/50 visual representation of Sent vs Recv */}
            <div className="h-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: '50%' }} title="Sent" />
            <div className="h-full transition-all duration-500 bg-gradient-to-r from-teal-400 to-teal-500" style={{ width: '50%' }} title="Received" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-2">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{stats?.net_sent_gb ?? '—'} GB Up</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div>{stats?.net_recv_gb ?? '—'} GB Down</span>
          </p>
        </div>
      </div>

      {/* Database Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Database size={18} className="text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Database Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <GraduationCap size={20} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900">{stats?.total_admissions ?? 0}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mt-1">Admissions</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Users size={20} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900">{stats?.total_students ?? 0}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mt-1">Students</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <CreditCard size={20} className="text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900">{stats?.total_payments ?? 0}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mt-1">Payments</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <BookOpen size={20} className="text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900">{stats?.total_enquiries ?? 0}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mt-1">Enquiries</p>
          </div>
        </div>
      </div>

      {stats?.note && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          ⚠ {stats.note}
        </p>
      )}
    </div>
  )
}
