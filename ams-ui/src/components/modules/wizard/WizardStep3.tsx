'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, ShieldCheck, FileCheck, Star } from 'lucide-react'
import { admissionsApi } from '@/lib/api'
import { getApplicableDocuments, groupByTier, type DocumentDef } from '@/lib/documentConfig'

interface DocSlot {
  def: DocumentDef
  file?: File
  uploaded?: { id: number; file_url: string; document_type: string }
  uploading?: boolean
  error?: string
}

const TIER_CONFIG = {
  mandatory: { label: 'Mandatory Documents', icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  conditional: { label: 'Category / Reservation Documents', icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  optional: { label: 'Optional Documents', icon: Star, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' },
} as const

export function WizardStep3({ admissionId, existingDocs, courseName, formData, onNext, onBack }: {
  admissionId: number
  existingDocs?: any[]
  courseName: string
  formData: Record<string, any>
  onNext: () => void
  onBack: () => void
}) {
  const applicableDocs = getApplicableDocuments(courseName, formData)

  const [slots, setSlots] = useState<DocSlot[]>(() => {
    return applicableDocs.map(def => {
      const existing = existingDocs?.find((e: any) => e.document_type === def.type)
      return existing ? { def, uploaded: existing } : { def }
    })
  })

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleFileSelect = async (index: number, file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, error: 'Only PDF, JPG, PNG files allowed' } : s))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, error: 'File must be under 5 MB' } : s))
      return
    }

    setSlots(prev => prev.map((s, i) => i === index ? { ...s, file, error: undefined, uploading: true } : s))

    try {
      const result = await admissionsApi.uploadDocument(admissionId, file, slots[index].def.type)
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: false, uploaded: result } : s))
    } catch (e: any) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: false, error: e.message || 'Upload failed' } : s))
    }
  }

  const removeFile = (index: number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, file: undefined, uploaded: undefined, error: undefined } : s))
    if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = ''
  }

  // Group slots by tier
  const grouped = {
    mandatory: slots.filter(s => s.def.tier === 'mandatory'),
    conditional: slots.filter(s => s.def.tier === 'conditional'),
    optional: slots.filter(s => s.def.tier === 'optional'),
  }

  const totalDocs = slots.length
  const uploadedDocs = slots.filter(s => s.uploaded).length

  const categoryLabel = formData.category_of_candidate || 'Not selected'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Upload size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Document Upload</h2>
              <p className="text-violet-100 text-xs mt-0.5">Step 3 · Upload required documents (PDF/JPG/PNG, max 5MB each)</p>
            </div>
          </div>
        </div>

        {/* Progress + Category Badge */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-gray-600">
                Category: <span className="text-violet-700 font-bold">{categoryLabel}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="text-xs font-semibold text-gray-600">
                Stream: <span className="text-violet-700 font-bold">{courseName || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalDocs > 0 ? (uploadedDocs / totalDocs) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-violet-700">{uploadedDocs}/{totalDocs}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Render each tier group */}
          {(['mandatory', 'conditional', 'optional'] as const).map(tier => {
            const tierSlots = grouped[tier]
            if (tierSlots.length === 0) return null
            const cfg = TIER_CONFIG[tier]
            const TierIcon = cfg.icon

            return (
              <div key={tier}>
                {/* Tier Header */}
                <div className="flex items-center gap-2 mb-3">
                  <TierIcon size={16} className={cfg.color} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {tierSlots.filter(s => s.uploaded).length}/{tierSlots.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {tierSlots.map(slot => {
                    const globalIdx = slots.findIndex(s => s.def.type === slot.def.type)
                    return (
                      <div key={slot.def.type} className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                        slot.uploaded ? 'border-emerald-300 bg-emerald-50/50' :
                        slot.error ? 'border-red-300 bg-red-50/30' :
                        `${cfg.border} ${cfg.bg} hover:border-violet-300 hover:bg-violet-50/30`
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {slot.uploaded ? (
                              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                            ) : slot.error ? (
                              <AlertCircle size={18} className="text-red-500 shrink-0" />
                            ) : (
                              <FileText size={18} className="text-gray-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{slot.def.label}</p>
                              {slot.uploaded && (
                                <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ Uploaded successfully</p>
                              )}
                              {slot.file && !slot.uploaded && !slot.uploading && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{slot.file.name}</p>
                              )}
                              {slot.uploading && (
                                <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                  <Loader2 size={12} className="animate-spin" /> Uploading...
                                </p>
                              )}
                              {slot.error && <p className="text-xs text-red-500 font-medium mt-0.5">{slot.error}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {slot.uploaded && (
                              <button onClick={() => removeFile(globalIdx)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                            <input
                              ref={el => { fileInputRefs.current[globalIdx] = el }}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={e => { if (e.target.files?.[0]) handleFileSelect(globalIdx, e.target.files[0]) }}
                            />
                            <button
                              onClick={() => fileInputRefs.current[globalIdx]?.click()}
                              disabled={slot.uploading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50"
                            >
                              {slot.uploaded ? 'Replace' : 'Upload'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <p className="text-[11px] text-gray-400 text-center pt-2">
            Accepted: PDF, JPG, PNG · Max size: 5 MB per file · Documents are also collected physically
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
          Continue →
        </button>
      </div>
    </div>
  )
}
