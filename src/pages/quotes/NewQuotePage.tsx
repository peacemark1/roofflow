import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quotesApi, companyApi } from '@/api'
import { gsap } from 'gsap'
import { Plus, Trash2, ChevronRight, ChevronLeft, Calculator, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const ACCESSORIES = ['VLG','RlC','RlG','SIT','Silicon','CLIPS','NAILS']
const ACC_LABELS: Record<string,string> = {
  VLG:'Valley Gutter', RlC:'Ridge Cap', RlG:'Rain Gutter',
  SIT:'Sidetrim', Silicon:'Sealant/Silicon', CLIPS:'Clips', NAILS:'Nails'
}
const ROOF_TYPES = ['Hip Roof Quote','Gable Roof Quote','Flat Roof Quote','Complex Roof Quote']

export function NewQuotePage() {
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const pageRef      = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0) // 0=client, 1=measurements, 2=costs, 3=review

  // Load company prices
  const { data: prices } = useQuery({
    queryKey: ['prices'],
    queryFn: () => companyApi.getPrices().then(r => r.data)
  })

  const { register, handleSubmit, watch, control, getValues } = useForm({
    defaultValues: {
      client_name:    '',
      client_phone:   '',
      client_site:    '',
      client_email:   '',
      roof_type:      'Hip Roof Quote',
      currency:       'GHS',
      sections:       [{ length_m: '', qty_sheets: '' }],
      accessories:    ACCESSORIES.map(item => ({ item, qty: 0 })),
      discount_pct:   0,
      installation:   0,
      transportation: 0,
      valid_days:     14,
      notes:          '',
    }
  })

  const { fields: sectionFields, append: addSection, remove: removeSection } =
    useFieldArray({ control, name: 'sections' })

  const mutation = useMutation({
    mutationFn: (data: any) => quotesApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      navigate(`/quotes/${res.data.id}`)
    }
  })

  // Live total calculation
  const watchSections     = watch('sections')
  const watchAccessories  = watch('accessories')
  const watchDiscountPct  = watch('discount_pct')
  const watchInstall      = watch('installation')
  const watchTransport    = watch('transportation')

  const priceMap = prices ? Object.fromEntries(prices.map((p: any) => [p.key, Number(p.unit_price)])) : {}
  const sheetPrice = priceMap['sheet'] || 27

  const totalSheets = watchSections.reduce((a: number, s: any) => a + (Number(s.qty_sheets) || 0), 0)
  const sheetTotal  = totalSheets * sheetPrice
  const accTotal    = watchAccessories.reduce((a: number, acc: any) => {
    const key = acc.item === 'Silicon' ? 'silicon' : acc.item === 'CLIPS' ? 'clips' : acc.item === 'NAILS' ? 'nails' : acc.item.toLowerCase().replace(' ','_')
    return a + (Number(acc.qty) || 0) * (priceMap[key] || 0)
  }, 0)
  const subtotal    = sheetTotal + accTotal
  const discount    = subtotal * (Number(watchDiscountPct) / 100)
  const additional  = Number(watchInstall) + Number(watchTransport)
  const total       = subtotal - discount + additional

  useEffect(() => {
    gsap.fromTo('.step-content',
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    )
  }, [step])

  const steps = ['Client', 'Measurements', 'Costs', 'Review']

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      sections:    data.sections.map((s: any) => ({
        length_m: Number(s.length_m), qty_sheets: Number(s.qty_sheets)
      })),
      accessories: data.accessories.filter((a: any) => Number(a.qty) > 0).map((a: any) => ({
        item: a.item, qty: Number(a.qty)
      })),
      discount_pct:   Number(data.discount_pct),
      installation:   Number(data.installation),
      transportation: Number(data.transportation),
    }
    mutation.mutate(payload)
  }

  return (
    <div ref={pageRef} className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/quotes')}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-3">
          <ChevronLeft size={14}/> Back to quotes
        </button>
        <h1 className="font-display font-bold text-2xl text-gray-900">New quote</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${i === step ? 'bg-brand-500 text-white' :
                i < step ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${i === step ? 'bg-white/20' : i < step ? 'bg-green-200' : 'bg-gray-100'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              {s}
            </div>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Client */}
        {step === 0 && (
          <div className="step-content card space-y-4">
            <h2 className="font-display font-semibold text-gray-900">Client details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Client name *</label>
                <input {...register('client_name', { required: true })} className="input" placeholder="Mr Paul" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone *</label>
                <input {...register('client_phone', { required: true })} className="input" placeholder="0540645524" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                <input {...register('client_email')} className="input" placeholder="client@email.com" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Site address *</label>
                <input {...register('client_site', { required: true })} className="input" placeholder="New Legon, Accra" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Roof type</label>
                <select {...register('roof_type')} className="input">
                  {ROOF_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Currency</label>
                <select {...register('currency')} className="input">
                  <option value="GHS">Ghana Cedis (₵)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Measurements */}
        {step === 1 && (
          <div className="step-content space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-gray-900">Roof sections</h2>
                <span className="text-xs text-gray-400">Enter each section measured on site</span>
              </div>

              {/* Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                <span className="col-span-1 text-xs text-gray-400">#</span>
                <span className="col-span-5 text-xs text-gray-400">Length (m)</span>
                <span className="col-span-5 text-xs text-gray-400">Sheets (qty)</span>
                <span className="col-span-1"></span>
              </div>

              <div className="space-y-2">
                {sectionFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 text-xs text-gray-400 font-mono">{i + 1}</span>
                    <input {...register(`sections.${i}.length_m`, { required: true })}
                      className="input col-span-5" placeholder="e.g. 7.3" type="number" step="0.1" />
                    <input {...register(`sections.${i}.qty_sheets`, { required: true })}
                      className="input col-span-5" placeholder="e.g. 21" type="number" />
                    <button type="button" onClick={() => removeSection(i)}
                      className="col-span-1 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => addSection({ length_m: '', qty_sheets: '' })}
                className="btn-ghost mt-3 text-xs">
                <Plus size={14}/> Add section
              </button>

              {/* Live total */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total sheets</span>
                <span className="font-display font-bold text-lg text-brand-500">{totalSheets}</span>
              </div>
            </div>

            {/* Accessories */}
            <div className="card">
              <h2 className="font-display font-semibold text-gray-900 mb-4">Accessories</h2>
              <div className="space-y-3">
                {watchAccessories.map((acc: any, i: number) => (
                  <div key={acc.item} className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">{ACC_LABELS[acc.item]}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {priceMap[acc.item === 'Silicon' ? 'silicon' : acc.item === 'CLIPS' ? 'clips' : acc.item === 'NAILS' ? 'nails' : acc.item.toLowerCase()] ?
                          formatCurrency(priceMap[acc.item === 'Silicon' ? 'silicon' : acc.item === 'CLIPS' ? 'clips' : acc.item === 'NAILS' ? 'nails' : acc.item.toLowerCase()]) : ''}
                      </span>
                      <input {...register(`accessories.${i}.qty`)}
                        type="number" min="0" className="input w-20 text-center" placeholder="0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Costs */}
        {step === 2 && (
          <div className="step-content card space-y-4">
            <h2 className="font-display font-semibold text-gray-900">Additional costs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Discount (%)</label>
                <input {...register('discount_pct')} type="number" min="0" max="100" step="0.5" className="input" placeholder="5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Installation (₵)</label>
                <input {...register('installation')} type="number" min="0" className="input" placeholder="2044" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Transportation (₵)</label>
                <input {...register('transportation')} type="number" min="0" className="input" placeholder="1670" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Valid (days)</label>
              <input {...register('valid_days')} type="number" min="1" className="input" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes</label>
                <textarea {...register('notes')} className="input resize-none" rows={3}
                  placeholder="Any additional notes for this quote..." />
              </div>
            </div>

            {/* Live totals preview */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Discount ({watchDiscountPct}%)</span><span className="text-red-500">-{formatCurrency(discount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Additional charges</span><span>{formatCurrency(additional)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2 mt-2">
                <span>Total</span><span className="text-brand-500">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="step-content card space-y-4">
            <h2 className="font-display font-semibold text-gray-900">Review & create</h2>
            <div className="space-y-3">
              {[
                ['Client',    getValues('client_name')],
                ['Site',      getValues('client_site')],
                ['Phone',     getValues('client_phone')],
                ['Roof type', getValues('roof_type')],
                ['Sections',  `${sectionFields.length} sections — ${totalSheets} total sheets`],
                ['Currency',  getValues('currency')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-brand-500">{formatCurrency(total)}</span>
              </div>
            </div>

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                Failed to create quote. Please try again.
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/quotes')}
            className="btn-ghost">
            <ChevronLeft size={16}/> {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary">
              Next <ChevronRight size={16}/>
            </button>
          ) : (
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? <><Loader2 size={16} className="animate-spin"/> Creating...</> : <><Calculator size={16}/> Create quote</>}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
