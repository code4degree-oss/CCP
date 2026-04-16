'use client'

import { Card } from '@/components/ui'

interface PlaceholderProps {
  title: string
  description: string
}

export function PlaceholderModule({ title, description }: PlaceholderProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-sm font-semibold text-txt-primary mb-1">{title}</h2>
      <p className="text-[11px] text-txt-muted mb-6">{description}</p>
      <Card className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-20">◈</div>
          <p className="text-sm text-txt-muted">Module under construction</p>
          <p className="text-[11px] text-txt-muted mt-1">Scaffold is ready · wire up your API</p>
        </div>
      </Card>
    </div>
  )
}
