export const formatCurrency = (amount: number, currencyCode: string = 'COP') => {
  // Aseguramos que el código de moneda esté en mayúsculas (ej: USD, EUR, COP)
  const code = currencyCode.toUpperCase()

  // Determinamos el locale. 'es-CO' es útil para COP, pero para USD/EUR
  // podrías usar 'en-US' o adaptarlo según la preferencia del usuario.
  // Por simplicidad, mantendremos 'es-CO' o usaremos un valor dinámico si es necesario.

  // Usaremos 'es-ES' como un locale más neutral para ejemplo,
  // pero el locale ideal dependería de la moneda y el usuario.
  const locale = 'es-CO' // O podrías usar 'es-ES' o 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    // --- CAMBIO CLAVE: Usar el parámetro dinámico ---
    currency: code,
    // ------------------------------------------------
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDecimal = (amount: number, locale: string = 'es-CO'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'decimal', // Especifica que es un número, no moneda
    minimumFractionDigits: 2, // Asegura que siempre haya al menos dos decimales
    maximumFractionDigits: 2, // Limita a un máximo de dos decimales
  }).format(amount)
}
