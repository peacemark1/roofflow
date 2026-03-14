import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '@/api'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Search, Users, FileText, Phone, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function ClientsPage() {
  const navigate  = useNavigate()
  const listRef   = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn:  () => clientsApi.list().then(r => r.data),
  })

  useEffect(() => {
    if (!clients) return
    gsap.fromTo('.client-card',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' }
    )
  }, [clients])

  const filtered = (clients || []).filter((c: any) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.site?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients?.length || 0} total</p>
        </div>
      </div>

      <div className="relative max-w-xs mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-8 text-sm" placeholder="Search clients..." />
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? 'No clients match your search' : 'No clients yet — they appear when you create quotes'}
          </p>
        </div>
      )}

      <div ref={listRef} className="grid grid-cols-1 gap-4">
        {filtered.map((client: any) => (
          <div key={client.id} className="client-card card hover:border-brand-200 transition-all cursor-pointer"
            onClick={() => navigate(`/quotes?client=${client.id}`)}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center
                                font-display font-bold text-brand-500 text-sm">
                  {client.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{client.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone size={11}/> {client.phone}
                    </span>
                    {client.site && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={11}/> {client.site}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">{client.quotes?.length || 0} quotes</p>
                {client.quotes?.length > 0 && (
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {formatCurrency(
                      client.quotes.reduce((a: number, q: any) => a + Number(q.total), 0)
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Recent quotes */}
            {client.quotes?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                {client.quotes.slice(0,3).map((q: any) => (
                  <div key={q.id}
                    onClick={e => { e.stopPropagation(); navigate(`/quotes/${q.id}`) }}
                    className="flex items-center justify-between text-sm hover:bg-gray-50 -mx-1 px-1 py-1 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-gray-300" />
                      <span className="font-mono text-xs text-gray-500">{q.quote_number}</span>
                      <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={q.status} />
                      <span className="font-medium text-gray-700">{formatCurrency(q.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
