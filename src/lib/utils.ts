export function formatCurrency(amount: number | string, currency = 'GHS'): string {
  const num    = Number(amount) || 0
  const symbol = currency === 'GHS' ? '₵' : '$'
  return `${symbol}${num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatPhone(phone: string): string {
  return phone?.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') || phone
}
