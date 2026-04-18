'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

/* Shared CSS classes */
export const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
export const selectClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
export const readonlyClass = "w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"

/* Field wrapper */
export function Field({ label, children, required, half }: { label: string; children: React.ReactNode; required?: boolean; half?: boolean }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="text-xs font-medium text-gray-500 block mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* Section header with icon */
export function WizSectionHeader({ icon: Icon, title, color = 'text-blue-700' }: { icon: any; title: string; color?: string }) {
  const bgMap: Record<string, string> = {
    'text-blue-700': 'bg-blue-50', 'text-amber-700': 'bg-amber-50', 'text-emerald-700': 'bg-emerald-50',
    'text-purple-700': 'bg-purple-50', 'text-rose-700': 'bg-rose-50',
  }
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-gray-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgMap[color] || 'bg-gray-50'}`}>
        <Icon size={16} className={color} />
      </div>
      <h3 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h3>
    </div>
  )
}

/* Searchable select dropdown */
export function SearchSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const filtered = useMemo(() => options.filter(o => o.toLowerCase().includes(q.toLowerCase())), [options, q])
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(!open)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
                className="bg-transparent text-sm w-full outline-none placeholder:text-gray-400" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No results</div>}
            {filtered.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); setQ('') }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${o === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
              >{o}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
