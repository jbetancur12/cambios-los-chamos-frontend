import { useState, useEffect } from 'react'

/**
 * Hook para detectar si el usuario está en desktop (pantalla >= 768px)
 * Usa el mismo breakpoint que Tailwind (md: 768px)
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Detectar en inicial
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkIsDesktop()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  return isDesktop
}
