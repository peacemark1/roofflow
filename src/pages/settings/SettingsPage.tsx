import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyApi } from '@/api'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { Loader2, Save, Building2, DollarSign, Users } from 'lucide-react'

type Tab = 'company' | 'prices' | 'team'

export function SettingsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('company')
  const [saved, setSaved] = useState(false)

  const { data: company } = useQuery({ queryKey: ['company'], queryFn: () => companyApi.get().then(r => r.data) })
  const { data: prices }  = useQuery({ queryKey: ['prices'],  queryFn: () => companyApi.getPrices().then(r => r.data) })
  const { data: team }    = useQuery({ queryKey: ['team'],    queryFn: () => companyApi.getTeam().then(r => r.data) })

  const companyForm = useForm({ values: company || {} })
  const [editPrices, setEditPrices] = useState<any[]>([])

  useEffect(() => { if (prices) setEditPrices(prices.map((p: any) => ({ ...p }))) }, [prices])

  const updateCompany = useMutation({
    mutationFn: (data: any) => companyApi.update(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company'] }); flashSaved() }
  })

  const updatePrices = useMutation({
    mutationFn: () => companyApi.updatePrices(editPrices.map(p => ({
      key: p.key, name: p.name, unit_price: Number(p.unit_price), unit: p.unit
    }))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prices'] }); flashSaved() }
  })

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const tabs = [
    { id: 'company', icon: Building2, label: 'Company'  },
    { id: 'prices',  icon: DollarSign, label: 'Prices'   },
    { id: 'team',    icon: Users,      label: 'Team'     },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your company profile and pricing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {/* Company tab */}
      {tab === 'company' && (
        <div className="card">
          <h2 className="font-display font-semibold text-gray-900 mb-5">Company profile</h2>
          <form onSubmit={companyForm.handleSubmit(data => updateCompany.mutate(data))}
            className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Company name</label>
                <input {...companyForm.register('name')} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Tagline</label>
                <input {...companyForm.register('tagline')} className="input" placeholder="Ultimate Roofing Master" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone</label>
                <input {...companyForm.register('phone')} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                <input {...companyForm.register('email')} type="email" className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Address</label>
                <input {...companyForm.register('address')} className="input" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={updateCompany.isPending} className="btn-primary">
                {updateCompany.isPending ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}
                Save changes
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </form>
        </div>
      )}

      {/* Prices tab */}
      {tab === 'prices' && (
        <div className="card">
          <h2 className="font-display font-semibold text-gray-900 mb-1">Material prices</h2>
          <p className="text-sm text-gray-500 mb-5">These prices auto-populate in every new quote</p>
          <div className="space-y-3">
            {editPrices.map((price, i) => (
              <div key={price.key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{price.name}</label>
                  <input value={price.name}
                    onChange={e => setEditPrices(prev => prev.map((p, j) => j === i ? {...p, name: e.target.value} : p))}
                    className="input text-sm" placeholder="Item name" />
                </div>
                <div className="w-32">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Price (₵)</label>
                  <input type="number" step="0.01" value={price.unit_price}
                    onChange={e => setEditPrices(prev => prev.map((p, j) => j === i ? {...p, unit_price: e.target.value} : p))}
                    className="input text-sm text-right" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => updatePrices.mutate()} disabled={updatePrices.isPending} className="btn-primary">
              {updatePrices.isPending ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}
              Save prices
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <div className="card">
          <h2 className="font-display font-semibold text-gray-900 mb-5">Team members</h2>
          <div className="space-y-3">
            {(team || []).map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center
                                font-display font-bold text-brand-500 text-sm">
                  {member.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
                <span className={`badge capitalize
                  ${member.role === 'owner' ? 'bg-brand-50 text-brand-500' :
                    member.role === 'estimator' ? 'bg-green-50 text-green-700' :
                    'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
