import { useQuery } from '@tanstack/react-query'
import { quotesApi } from '@/api'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Plus, Search, FileText, ArrowRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

const FILTERS = ['all','draft','sent','viewed','approved','declined']

export function QuotesPage() {
  const navigate = useNavigate()
  const listRef  = useRef<HTMLDivElement>(null)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn:  () => quotesApi.list().then(r => r.data),
  })

  useEffect(() => {
    if (!quotes) return
    gsap.fromTo('.quote-row',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
    )
  }, [quotes, filter])

  const filtered = (quotes || []).filter((q: any) => {
    const matchFilter = filter === 'all' || q.status === filter
    const matchSearch = !search ||
      q.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quotes?.length || 0} total</p>
        </div>
        <button onClick={() => navigate('/quotes/new')} className="btn-primary">
          <Plus size={16}/> New quote
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-sm" placeholder="Search client or quote #..." />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap
                ${filter === f ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden" ref={listRef}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Quote #','Client','Site','Roof type','Total','Status','Date',''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-14">
                  <FileText size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {search ? 'No quotes match your search' : 'No quotes yet'}
                  </p>
                  {!search && (
                    <button onClick={() => navigate('/quotes/new')} className="btn-primary mt-3 mx-auto">
                      <Plus size={14}/> Create first quote
                    </button>
                  )}
                </td>
              </tr>
            )}
            {filtered.map((q: any) => (
              <tr key={q.id}
                className="quote-row border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/quotes/${q.id}`)}>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-gray-600">{q.quote_number}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium text-gray-900">{q.clients?.name || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-500">{q.clients?.site || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-500">{q.roof_type}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(q.total, q.currency)}</span>
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={q.status} /></td>
                <td className="px-4 py-3.5">
                  <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
                </td>
                <td className="px-4 py-3.5">
                  <ArrowRight size={14} className="text-gray-300" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
