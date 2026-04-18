'use client'
import { Check } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Admission & Fee' },
  { num: 2, label: 'Student Details' },
  { num: 3, label: 'Documents' },
  { num: 4, label: 'Confirmation' },
  { num: 5, label: 'Final Preview' },
]

export function StepProgress({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="w-full px-4 py-5">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((step, i) => {
          const isDone = completed.includes(step.num)
          const isActive = current === step.num
          const isLast = i === STEPS.length - 1
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                  isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isDone ? <Check size={16} strokeWidth={3} /> : step.num}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap tracking-wide ${
                  isDone ? 'text-emerald-600' : isActive ? 'text-blue-700' : 'text-gray-400'
                }`}>{step.label}</span>
              </div>
              {!isLast && (
                <div className="flex-1 mx-2 h-0.5 rounded-full transition-all duration-500" style={{
                  background: isDone ? '#10b981' : current > step.num ? '#10b981' : '#e5e7eb',
                  marginTop: '-14px'
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
