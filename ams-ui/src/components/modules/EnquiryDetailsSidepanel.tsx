'use client'

import { useState } from 'react'
import { X, User, MapPin, GraduationCap, Phone, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import clsx from 'clsx'

interface Props {
  enquiry: any
  onClose: () => void
  branchName: (id: number) => string
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'academic', label: 'Academic & NEET', icon: GraduationCap },
  { id: 'other', label: 'Other Info', icon: Info },
] as const

type TabId = typeof TABS[number]['id']

function Field({ label, value, mono, accent }: { label: string; value?: string | number | boolean | null; mono?: boolean; accent?: string }) {
  const display = value === undefined || value === null || value === ''
    ? '—'
    : typeof value === 'boolean'
      ? value ? 'Yes' : 'No'
      : String(value)

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-txt-muted font-medium">{label}</div>
      <div className={clsx(
        'text-xs',
        display === '—' ? 'text-txt-muted' : accent ? accent : 'text-txt-primary',
        mono && 'font-mono',
      )}>
        {display}
      </div>
    </div>
  )
}

export function EnquiryDetailsSidepanel({ enquiry, onClose, branchName }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const e = enquiry

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-bg-base border-l border-bg-border z-50 flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border bg-bg-surface/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue/40 to-accent-green/40 flex items-center justify-center text-sm font-semibold text-txt-primary">
              {e.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'E'}
            </div>
            <div>
              <div className="text-sm font-semibold text-txt-primary">{e.full_name || 'Unknown'}</div>
              <div className="text-[11px] font-mono text-accent-blue">Enquiry ID: #{e.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-0.5 px-4 py-2 border-b border-bg-border bg-bg-surface/40 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded text-[11px] font-medium transition-all whitespace-nowrap',
                  tab === t.id
                    ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
                    : 'text-txt-muted hover:text-txt-primary hover:bg-bg-hover border border-transparent',
                )}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ── Overview ────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Basic Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" value={e.full_name} />
                  <Field label="Mobile" value={e.mobile} mono />
                  <Field label="Parent Mobile" value={e.parent_mobile} mono />
                  <Field label="Mother Name" value={e.mother_name} />
                  <Field label="Gender" value={e.gender} />
                  <Field label="Date of Birth" value={e.dob} mono />
                  <Field label="Category" value={e.category} />
                  <Field label="Candidate Type" value={e.candidate_type} />
                </div>
              </div>

              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Enquiry Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Branch" value={branchName(e.branch)} />
                  <Field label="Course Interest" value={e.course_interest} />
                  <Field label="Filled By" value={e.counselor_name || '—'} />
                  <Field label="Date" value={e.created_at ? new Date(e.created_at).toLocaleDateString() : ''} mono />
                  <Field label="Source" value={e.source} />
                </div>
              </div>
            </div>
          )}

          {/* ── Academic & NEET ────────────────────────────────────────────── */}
          {tab === 'academic' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Academic Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="HSC Percentage" value={e.hsc_percentage ? `${e.hsc_percentage}%` : ''} mono />
                </div>
              </div>

              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">NEET Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expected NEET Marks" value={e.neet_expected_marks} mono accent="text-accent-green" />
                  <Field label="NEET Application No" value={e.neet_application_no} mono />
                  <Field label="NEET Roll No" value={e.neet_roll_no} mono />
                </div>
              </div>
            </div>
          )}

          {/* ── Other Info ────────────────────────────────────────────── */}
          {tab === 'other' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Additional Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tuition Name" value={e.tuition_name} />
                  <Field label="Reference Name" value={e.reference_name} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-bg-border bg-bg-surface/60 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </>
  )
}
