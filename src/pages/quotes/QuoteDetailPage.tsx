import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { quotesApi } from '@/api'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import {
  ChevronLeft, Download, Send, Loader2,
  CheckCircle, MessageCircle, Link2, Eye, Trash2
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RoofRenderer } from '@/components/ui/RoofRenderer'

export function QuoteDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const pageRef  = useRef<HTMLDivElement>(null)
  const [sendMethod, setSendMethod] = useState<string|null>(null)
  const [showRenderer, setShowRenderer] = useState(false)

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn:  () => quotesApi.get(id!).then(r => r.data),
  })

  const sendMutation = useMutation({
    mutationFn: (method: string) => quotesApi.send(id!, method),
    onSuccess: (res, method) => {
      qc.invalidateQueries({ queryKey: ['quote', id] })
      if (method === 'whatsapp' && res.data.link) {
        window.open(res.data.link, '_blank')
      }
      setSendMethod(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => quotesApi.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); navigate('/quotes') }
  })

  useEffect(() => {
    if (!quote) return
    gsap.fromTo(pageRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, [quote])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-brand-500" />
    </div>
  )
  if (!quote) return <div className="p-6 text-gray-500">Quote not found</div>

  const items = quote.quote_line_items?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []

  return (
    <div ref={pageRef} className="p-6 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/quotes')}
            className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={20}/>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-bold text-xl text-gray-900">
                {quote.quote_number}
              </h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {quote.clients?.name} · {quote.clients?.site} · {formatDate(quote.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {quote.pdf_url && quote.pdf_url !== 'processing' && (
            <a href={quote.pdf_url} target="_blank" rel="noreferrer" className="btn-ghost">
              <Download size={15}/> PDF
            </a>
          )}
          {!quote.pdf_url && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin"/> Generating PDF...
            </span>
          )}
          <button onClick={() => setShowRenderer(!showRenderer)} className="btn-ghost">
            <Eye size={15}/> 3D Render
          </button>
          <button onClick={() => { if (confirm('Delete this quote?')) deleteMutation.mutate() }}
            className="btn-ghost text-red-400 hover:text-red-500 hover:border-red-200">
            <Trash2 size={15}/>
          </button>
        </div>
      </div>

      {/* 3D Renderer */}
      {showRenderer && (
        <div className="card mb-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4">3D Roof Render</h2>
          <RoofRenderer
            roofType={quote.roof_type?.toLowerCase().includes('hip') ? 'hip' : 'gable'}
            quoteId={quote.id}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Quote details */}
        <div className="col-span-2 space-y-5">
          {/* Client + Company */}
          <div className="card">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">From</p>
                <p className="font-semibold text-gray-900 text-sm">Your Company</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">To</p>
                <p className="font-semibold text-gray-900 text-sm">{quote.clients?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{quote.clients?.site}</p>
                <p className="text-xs text-gray-500">{quote.clients?.phone}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-50 border-b border-brand-100">
                  {['#','Description','Qty','Unit','Unit Price','Amount'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-brand-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={item.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price, quote.currency)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Totals + Send */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="card">
            <h3 className="font-display font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Subtotal',    formatCurrency(quote.subtotal,     quote.currency)],
                [`Discount (${Number(quote.discount_pct).toFixed(1)}%)`, `-${formatCurrency(quote.discount_amt, quote.currency)}`],
                ['Installation',   formatCurrency(quote.installation,   quote.currency)],
                ['Transportation', formatCurrency(quote.transportation, quote.currency)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-display font-bold text-base">
                <span>Total</span>
                <span className="text-brand-500">{formatCurrency(quote.total, quote.currency)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Valid until: {quote.valid_until}
            </div>
          </div>

          {/* Send */}
          <div className="card">
            <h3 className="font-display font-semibold text-gray-900 mb-3">Send to client</h3>
            <div className="space-y-2">
              {[
                { method: 'email',    icon: Send,          label: 'Send via Email'    },
                { method: 'whatsapp', icon: MessageCircle, label: 'Send via WhatsApp' },
                { method: 'link',     icon: Link2,         label: 'Copy share link'   },
              ].map(({ method, icon: Icon, label }) => (
                <button key={method}
                  onClick={() => { setSendMethod(method); sendMutation.mutate(method) }}
                  disabled={sendMutation.isPending}
                  className="w-full btn-ghost justify-start text-sm py-2.5">
                  {sendMutation.isPending && sendMethod === method
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Icon size={15} />
                  }
                  {label}
                </button>
              ))}
            </div>

            {quote.status === 'approved' && (
              <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle size={15}/>
                <span className="text-xs font-medium">Client approved</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-500">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
