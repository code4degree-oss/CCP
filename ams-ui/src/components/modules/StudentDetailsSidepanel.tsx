'use client'

import { useState } from 'react'
import { X, User, MapPin, GraduationCap, FileText, Shield, Check, Clock, AlertTriangle, Upload } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import type { Student } from '@/types'
import clsx from 'clsx'

interface Props {
  student: Student
  onClose: () => void
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'category', label: 'Category', icon: Shield },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FileText },
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

function BoolBadge({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded border text-xs',
      value
        ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
        : 'bg-bg-hover border-bg-border text-txt-muted',
    )}>
      {value ? <Check size={12} /> : <X size={12} />}
      {label}
    </div>
  )
}

function DocStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified': return <Check size={13} className="text-accent-green" />
    case 'uploaded': return <Upload size={13} className="text-accent-blue" />
    case 'rejected': return <AlertTriangle size={13} className="text-accent-red" />
    default: return <Clock size={13} className="text-accent-amber" />
  }
}

export function StudentDetailsSidepanel({ student, onClose }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const s = student
  const p = s.personal
  const addr = s.address
  const cat = s.categoryDetails
  const acad = s.academic
  const docs = s.documents ?? []

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[600px] bg-bg-base border-l border-bg-border z-50 flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border bg-bg-surface/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue/40 to-accent-green/40 flex items-center justify-center text-sm font-semibold text-txt-primary">
              {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-semibold text-txt-primary">{s.fullName}</div>
              <div className="text-[11px] font-mono text-accent-blue">{s.enrollmentNo}</div>
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
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-card border border-bg-border rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold font-mono text-txt-primary">{s.neetRank?.toLocaleString('en-IN') ?? '—'}</div>
                  <div className="text-[10px] text-txt-muted uppercase tracking-widest mt-0.5">NEET Rank</div>
                </div>
                <div className="bg-bg-card border border-bg-border rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold font-mono text-accent-green">{s.neetMarks ?? '—'}</div>
                  <div className="text-[10px] text-txt-muted uppercase tracking-widest mt-0.5">NEET Marks</div>
                </div>
                <div className="bg-bg-card border border-bg-border rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold font-mono text-accent-purple">{docs.length}</div>
                  <div className="text-[10px] text-txt-muted uppercase tracking-widest mt-0.5">Documents</div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Basic Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" value={s.fullName} />
                  <Field label="Father's Name" value={s.fatherName} />
                  <Field label="Mother's Name" value={s.motherName} />
                  <Field label="Date of Birth" value={s.dob} mono />
                  <Field label="Gender" value={s.gender} />
                  <Field label="Category" value={s.category} />
                  <Field label="Mobile" value={s.mobile} mono />
                  <Field label="Email" value={s.email} />
                  <Field label="Aadhaar No." value={s.aadhaarNo} mono />
                  <Field label="Branch" value={s.branch} />
                  <Field label="Filled By" value={s.counselor} />
                  <Field label="Enrolled On" value={s.createdAt} mono />
                </div>
              </div>
            </div>
          )}

          {/* ── Personal ────────────────────────────────────────────── */}
          {tab === 'personal' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">NEET Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NEET Roll No." value={p?.neetRollNo} mono />
                  <Field label="Application No." value={p?.applicationNo} mono />
                  <Field label="NEET Rank" value={p?.neetRank?.toLocaleString('en-IN')} mono accent="text-accent-blue" />
                  <Field label="NEET Marks" value={p?.neetMarks} mono accent="text-accent-green" />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Personal Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Religion" value={p?.religion} />
                  <Field label="Nationality" value={p?.nationality} />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Special Status</div>
                <div className="grid grid-cols-2 gap-3">
                  <BoolBadge label="Name Changed" value={p?.isNameChanged} />
                  <BoolBadge label="NRI Interest" value={p?.nriInterest} />
                  <BoolBadge label="OCI / PIO Holder" value={p?.ociPioHolder} />
                  <BoolBadge label="Maharashtra Domicile" value={p?.maharashtraDomicile} />
                  <BoolBadge label="PwD" value={p?.pwd} />
                  <BoolBadge label="Orphan" value={p?.orphan} />
                  <BoolBadge label="Minority Claim" value={p?.minorityClaim} />
                  <BoolBadge label="Linguistic Minority" value={p?.linguisticMinorityClaim} />
                </div>
              </div>
              {(p?.selectedMinority || p?.selectedLinguisticMinority) && (
                <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                  <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Minority Details</div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Selected Minority" value={p?.selectedMinority} />
                    <Field label="Linguistic Minority" value={p?.selectedLinguisticMinority} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Address ─────────────────────────────────────────────── */}
          {tab === 'address' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Residential Address</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Field label="Address Line" value={addr?.addressLine} /></div>
                  <Field label="City" value={addr?.city} />
                  <Field label="District" value={addr?.district} />
                  <Field label="Taluka" value={addr?.taluka} />
                  <Field label="State" value={addr?.state} />
                  <Field label="Pincode" value={addr?.pincode} mono />
                  <Field label="Region of Residence" value={addr?.regionOfResidence} />
                </div>
              </div>
            </div>
          )}

          {/* ── Category ────────────────────────────────────────────── */}
          {tab === 'category' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Category Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category" value={cat?.category} />
                  <Field label="Sub-Category" value={cat?.subCategory} />
                  <Field label="Annual Family Income" value={cat?.annualFamilyIncome ? `₹${cat.annualFamilyIncome.toLocaleString('en-IN')}` : undefined} mono />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Caste Certificate</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status" value={cat?.casteCertStatus} />
                  <Field label="Certificate No." value={cat?.casteCertNo} mono />
                  <Field label="District" value={cat?.casteCertDistrict} />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Caste Validity</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status" value={cat?.casteValidityStatus} />
                  <Field label="Validity No." value={cat?.casteValidityNo} mono />
                  <Field label="District" value={cat?.casteValidityDistrict} />
                  <Field label="Application Date" value={cat?.casteValidityApplicationDate} mono />
                  <Field label="Application No." value={cat?.casteValidityApplicationNo} mono />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">NCL / EWS</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NCL Status" value={cat?.nclStatus} />
                  <Field label="NCL Certificate No." value={cat?.nclCertificateNo} mono />
                  <Field label="NCL District" value={cat?.nclDistrict} />
                  <Field label="NCL Certificate Date" value={cat?.nclCertificateDate} mono />
                  <Field label="EWS Certificate No." value={cat?.ewsCertificateNo} mono />
                  <Field label="EWS District" value={cat?.ewsDistrict} />
                </div>
              </div>
            </div>
          )}

          {/* ── Academic ────────────────────────────────────────────── */}
          {tab === 'academic' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">SSC (10th) Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Qualification" value={acad?.sscQualification} />
                  <Field label="Passing Year" value={acad?.sscPassingYear} mono />
                  <Field label="Medium / Language" value={acad?.sscLanguage} />
                  <Field label="State" value={acad?.sscState} />
                  <Field label="District" value={acad?.sscDistrict} />
                  <Field label="Taluka" value={acad?.sscTaluka} />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">HSC (12th) Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Result" value={acad?.hscResult} />
                  <Field label="Passing Year" value={acad?.hscPassingYear} mono />
                  <Field label="Roll No." value={acad?.hscRollNo} mono />
                  <Field label="State" value={acad?.hscState} />
                  <Field label="District" value={acad?.hscDistrict} />
                  <Field label="Taluka" value={acad?.hscTaluka} />
                </div>
              </div>
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Subject Marks</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Physics" value={acad?.physicsMarks} mono accent="text-accent-blue" />
                  <Field label="Chemistry" value={acad?.chemistryMarks} mono accent="text-accent-cyan" />
                  <Field label="Biology" value={acad?.biologyMarks} mono accent="text-accent-green" />
                  <Field label="English" value={acad?.englishMarks} mono accent="text-accent-amber" />
                </div>
                <div className="border-t border-bg-border mt-4 pt-4 grid grid-cols-2 gap-4">
                  {acad?.pcmTotal && <Field label="PCM Total" value={acad?.pcmTotal} mono accent="text-accent-purple" />}
                  {acad?.pcmeTotal && <Field label="PCME Total" value={acad?.pcmeTotal} mono accent="text-accent-purple" />}
                  {acad?.pcmPercentage && <Field label="PCM %" value={`${acad.pcmPercentage}%`} mono accent="text-accent-green" />}
                  {acad?.pcmePercentage && <Field label="PCME %" value={`${acad.pcmePercentage}%`} mono accent="text-accent-green" />}
                  
                  {acad?.pcbTotal && <Field label="PCB Total" value={acad?.pcbTotal} mono accent="text-accent-purple" />}
                  {acad?.pcbeTotal && <Field label="PCBE Total" value={acad?.pcbeTotal} mono accent="text-accent-purple" />}
                  {acad?.pcbPercentage && <Field label="PCB %" value={`${acad.pcbPercentage}%`} mono accent="text-accent-green" />}
                  {acad?.pcbePercentage && <Field label="PCBE %" value={`${acad.pcbePercentage}%`} mono accent="text-accent-green" />}
                  
                  {!acad?.pcmTotal && !acad?.pcbTotal && (
                    <>
                      <Field label="PCB Total" value={acad?.pcbTotal} mono accent="text-accent-purple" />
                      <Field label="PCBE Total" value={acad?.pcbeTotal} mono accent="text-accent-purple" />
                      <Field label="PCB %" value={acad?.pcbPercentage ? `${acad.pcbPercentage}%` : undefined} mono accent="text-accent-green" />
                      <Field label="PCBE %" value={acad?.pcbePercentage ? `${acad.pcbePercentage}%` : undefined} mono accent="text-accent-green" />
                    </>
                  )}
                </div>
              </div>
              {(acad?.parallelReservation || acad?.reservationException || acad?.specifiedReservation || acad?.defenceQuota) && (
                <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                  <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold mb-3">Reservation & Quota</div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Parallel Reservation" value={acad?.parallelReservation} />
                    <Field label="Reservation Exception" value={acad?.reservationException} />
                    <Field label="Specified Reservation" value={acad?.specifiedReservation} />
                    <Field label="Defence Quota" value={acad?.defenceQuota} />
                    <Field label="Hilly Area Village" value={acad?.hillyAreaVillage} />
                    <Field label="Hilly Area Taluka" value={acad?.hillyAreaTaluka} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Documents ───────────────────────────────────────────── */}
          {tab === 'documents' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest text-txt-muted font-semibold">{docs.length} Documents</div>
                <Button variant="primary" size="sm">
                  <Upload size={12} /> Upload
                </Button>
              </div>
              {docs.length === 0 ? (
                <div className="bg-bg-card border border-bg-border rounded-lg p-8 text-center text-txt-muted text-xs">
                  No documents uploaded yet.
                </div>
              ) : (
                docs.map(d => (
                  <div key={d.id} className="bg-bg-card border border-bg-border rounded-lg p-4 flex items-center justify-between group hover:border-accent-blue/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-bg-hover flex items-center justify-center">
                        <FileText size={14} className="text-txt-muted" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-txt-primary">{d.documentType}</div>
                        <div className="text-[10px] font-mono text-txt-muted">{d.uploadedAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold border capitalize',
                        d.status === 'verified' && 'bg-accent-green/10 border-accent-green/20 text-accent-green',
                        d.status === 'uploaded' && 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue',
                        d.status === 'rejected' && 'bg-accent-red/10 border-accent-red/20 text-accent-red',
                        d.status === 'pending' && 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber',
                      )}>
                        <DocStatusIcon status={d.status} />
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-bg-border bg-bg-surface/60 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          <Button variant="primary" size="sm">Edit Student</Button>
        </div>
      </div>
    </>
  )
}
