import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Home, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  company_name:    z.string().min(2, 'Company name required'),
  company_phone:   z.string().min(10, 'Valid phone required'),
  company_address: z.string().min(5, 'Address required'),
  name:            z.string().min(2, 'Your name required'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Min 8 characters'),
})
type FormData = z.infer<typeof schema>

export function SignupPage() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    )
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('')
    try {
      await authApi.signup(data)
      // Auto-login after signup
      const loginRes = await authApi.login(data.email, data.password)
      login(loginRes.data.access_token, loginRes.data.user)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Signup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div ref={cardRef} className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gray-900">RoofFlow</span>
        </div>

        <div className="card">
          <h1 className="font-display font-bold text-xl text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Get your roofing company on RoofFlow</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Company name</label>
                <input {...register('company_name')} className="input" placeholder="Kinkok Roofing" />
                {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone</label>
                <input {...register('company_phone')} className="input" placeholder="0240100035" />
                {errors.company_phone && <p className="text-xs text-red-500 mt-1">{errors.company_phone.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Address</label>
                <input {...register('company_address')} className="input" placeholder="Tulip st, Lakeside" />
                {errors.company_address && <p className="text-xs text-red-500 mt-1">{errors.company_address.message}</p>}
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Your account</p>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Your name</label>
              <input {...register('name')} className="input" placeholder="Peacemark Kportufe" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="you@company.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'}
                  className="input pr-10" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
