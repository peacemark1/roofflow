import { useQuery } from '@tanstack/react-query'
import { companyApi, quotesApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Plus, TrendingUp, FileText, Users, CheckCircle, ArrowRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const pageRef   = useRef<HTMLDivElement>(null)

  const { data: stats }  = useQuery({ queryKey: ['stats'],  queryFn: () => companyApi.getStats().then(r => r.data) })
  const { data: quotes } = useQuery({ queryKey: ['quotes'], queryFn: () => quotesApi.list().then(r => r.data) })

  useEffect(() => {
    if (!pageRef.current) return
    gsap.fromTo('.fade-up',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    )
  }, [stats])

  const recent = quotes?.slice(0, 5) || []

  const statCards = [
    { label: 'Total quotes',    value: stats?.total_quotes  ?? '—', icon: FileText,    color: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Approved',        value: stats?.approved      ?? '—', icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50'  },
    { label: 'Total clients',   value: stats?.total_clients ?? '—', icon: Users,       color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Win rate',        value: stats ? `${stats.win_rate}%` : '—', icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50' },
  ]

  return (
    <div ref={pageRef} className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="fade-up flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today</p>
        </div>
        <button onClick={() => navigate('/quotes/new')} className="btn-primary">
          <Plus size={16} /> New quote
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="fade-up card">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue card */}
      <div className="fade-up card mb-8 bg-brand-500 border-brand-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100">Total approved revenue</p>
            <p className="font-display font-bold text-3xl text-white mt-1">
              {stats ? formatCurrency(stats.total_revenue) : '—'}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Recent quotes */}
      <div className="fade-up card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-gray-900">Recent quotes</h2>
          <button onClick={() => navigate('/quotes')}
            className="text-sm text-brand-500 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14}/>
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No quotes yet</p>
            <button onClick={() => navigate('/quotes/new')} className="btn-primary mt-3 mx-auto">
              <Plus size={14}/> Create first quote
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((q: any) => (
              <div key={q.id}
                onClick={() => navigate(`/quotes/${q.id}`)}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{q.clients?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{q.quote_number} · {formatDate(q.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={q.status} />
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(q.total)}</p>
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
