import { useState } from 'react'

export function VersionBadge() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <button
        type="button"
        className="text-[10px] leading-none text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors cursor-default select-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((v) => !v)}
      >
        {__COMMIT_HASH__}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded bg-popover border text-[10px] text-muted-foreground whitespace-nowrap shadow-sm">
          {__COMMIT_HASH__} &middot; {__COMMIT_DATE__}
          <br />
          {__BACKEND_COMMIT_HASH__} &middot; {__BACKEND_COMMIT_DATE__}
        </div>
      )}
    </div>
  )
}
