'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { admissionsApi } from '@/lib/api'

interface DocSlot {
  type: string
  label: string
  file?: File
  uploaded?: { id: number; file_url: string; document_type: string }
  uploading?: boolean
  error?: string
}

export function WizardStep3({ admissionId, existingDocs, onNext, onBack }: {
  admissionId: number
  existingDocs?: any[]
  onNext: () => void
  onBack: () => void
}) {
  const [slots, setSlots] = useState<DocSlot[]>(() => {
    const defaults: DocSlot[] = [
      { type: 'Student Photo', label: 'Student Photo' },
      { type: 'Aadhaar / ID Proof', label: 'Aadhaar / ID Proof' },
      { type: 'Marksheet / Certificates', label: 'Marksheet / Certificates' },
    ]
    if (existingDocs?.length) {
      return defaults.map(d => {
        const existing = existingDocs.find((e: any) => e.document_type === d.type)
        return existing ? { ...d, uploaded: existing } : d
      })
    }
    return defaults
  })

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleFileSelect = async (index: number, file: File) => {
    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, error: 'Only PDF, JPG, PNG files allowed' } : s))
      return
    }
    // Validate size
    if (file.size > 1 * 1024 * 1024) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, error: 'File must be under 1 MB' } : s))
      return
    }

    setSlots(prev => prev.map((s, i) => i === index ? { ...s, file, error: undefined, uploading: true } : s))

    try {
      const result = await admissionsApi.uploadDocument(admissionId, file, slots[index].type)
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: false, uploaded: result } : s))
    } catch (e: any) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: false, error: e.message || 'Upload failed' } : s))
    }
  }

  const removeFile = (index: number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, file: undefined, uploaded: undefined, error: undefined } : s))
    if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = ''
  }

  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Upload size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Document Upload</h2>
              <p className="text-violet-100 text-xs mt-0.5">Step 3 · Upload required documents (PDF/JPG/PNG, max 1MB each)</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {slots.map((slot, idx) => (
            <div key={slot.type} className={`border-2 border-dashed rounded-xl p-5 transition-all ${
              slot.uploaded ? 'border-emerald-300 bg-emerald-50/50' :
              slot.error ? 'border-red-300 bg-red-50/30' :
              'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {slot.uploaded ? (
                    <CheckCircle size={20} className="text-emerald-500" />
                  ) : slot.error ? (
                    <AlertCircle size={20} className="text-red-500" />
                  ) : (
                    <FileText size={20} className="text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{slot.label}</p>
                    {slot.uploaded && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        ✓ Uploaded successfully
                      </p>
                    )}
                    {slot.file && !slot.uploaded && !slot.uploading && (
                      <p className="text-xs text-gray-500 mt-0.5">{slot.file.name} ({formatSize(slot.file.size)})</p>
                    )}
                    {slot.uploading && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Uploading...
                      </p>
                    )}
                    {slot.error && <p className="text-xs text-red-500 font-medium mt-0.5">{slot.error}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {slot.uploaded && (
                    <button onClick={() => removeFile(idx)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <input
                    ref={el => { fileInputRefs.current[idx] = el }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileSelect(idx, e.target.files[0]) }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    disabled={slot.uploading}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    {slot.uploaded ? 'Replace' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <p className="text-[11px] text-gray-400 text-center pt-2">
            Accepted: PDF, JPG, PNG · Max size: 1 MB per file
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
