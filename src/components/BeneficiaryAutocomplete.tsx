import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { X as XIcon } from 'lucide-react'
import type { BeneficiaryData } from '@/hooks/useBeneficiarySuggestions'

interface BeneficiaryAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectSuggestion: (suggestion: BeneficiaryData) => void
  suggestions: BeneficiaryData[]
  placeholder?: string
  label?: string
  required?: boolean
  displayField?: 'name' | 'id' | 'phone'
}

export function BeneficiaryAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder = '',
  label = '',
  required = false,
  displayField = 'name',
}: BeneficiaryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSuggestionClick = (suggestion: BeneficiaryData) => {
    onSelectSuggestion(suggestion)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const displayValue = (suggestion: BeneficiaryData) => {
    if (displayField === 'name') {
      return suggestion.name
    } else if (displayField === 'id') {
      return suggestion.id
    } else if (displayField === 'phone') {
      return suggestion.phone
    }
    return suggestion.name
  }

  const suggestionLabel = (suggestion: BeneficiaryData) => {
    return `${suggestion.name} • ${suggestion.id} • ${suggestion.phone}`
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      )}
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.id}-${suggestion.phone}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors text-sm border-b last:border-b-0"
            >
              <div className="font-medium">{displayValue(suggestion)}</div>
              <div className="text-xs text-muted-foreground">{suggestionLabel(suggestion)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
