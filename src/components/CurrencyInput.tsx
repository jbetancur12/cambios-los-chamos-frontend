import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { InputHTMLAttributes } from 'react'

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null | undefined
  onValueChange: (value: number | null) => void
}

// Siempre entero, redondeado hacia arriba
const formatNum = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return ''
  return Math.ceil(Number(n)).toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

export function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
  const [text, setText] = useState<string>(() => formatNum(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(formatNum(value))
    }
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, '')

    if (!digits) {
      setText('')
      onValueChange(null)
      return
    }

    const int = parseInt(digits, 10)
    setText(int.toLocaleString('es-CO', { maximumFractionDigits: 0 }))
    onValueChange(int)
  }

  const handleBlur = () => {
    setFocused(false)
    const parsed = parseInt(text.replace(/\D/g, ''), 10)
    setText(formatNum(isNaN(parsed) ? value : parsed))
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      {...props}
      value={text}
      onChange={handleChange}
      onFocus={(e) => {
        setFocused(true)
        e.target.select()
      }}
      onBlur={handleBlur}
    />
  )
}
