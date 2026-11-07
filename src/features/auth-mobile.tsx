import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { api } from '../api'
import { sessionChanged } from '../state'
import { Button } from '../components/ui/button'
import { Field, Notice } from '../components/shared'
import { problem } from '../api'

export function MobileLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (session) => {
      sessionChanged(session)
      void navigate({ to: '/perfil' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <div className="mobile-auth-page">
      <div className="mobile-auth-header">
        <Link to="/" className="mobile-auth-back">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="mobile-auth-logo">KURIO</h1>
      </div>

      <div className="mobile-auth-content">
        <div className="mobile-auth-title">
          <h2>Entrar</h2>
          <p>Acesse sua coleção</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-auth-form">
          <Field
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <Field
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {login.isError && <Notice kind="error">{problem(login.error).message}</Notice>}

          <Button type="submit" disabled={login.isPending} className="mobile-auth-submit">
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mobile-auth-divider"><span>ou</span></div>

        <div className="mobile-auth-social">
          <button type="button" className="mobile-social-btn">
            <span>Google</span>
          </button>
          <button type="button" className="mobile-social-btn">
            <span>Facebook</span>
          </button>
        </div>

        <div className="mobile-auth-footer">
          <p>Não tem conta? <Link to="/cadastro" search={{ next: '/' }} className="mobile-auth-link">Criar conta</Link></p>
        </div>
      </div>
    </div>
  )
}

export function MobileRegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (session) => {
      sessionChanged(session)
      void navigate({ to: '/perfil' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    register.mutate({ name, email, phone: '', password })
  }

  return (
    <div className="mobile-auth-page">
      <div className="mobile-auth-header">
        <Link to="/" className="mobile-auth-back">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="mobile-auth-logo">KURIO</h1>
      </div>

      <div className="mobile-auth-content">
        <div className="mobile-auth-title">
          <h2>Criar conta</h2>
          <p>Comece sua jornada</p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-auth-form">
          <Field
            label="Nome completo"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <Field
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {register.isError && <Notice kind="error">{problem(register.error).message}</Notice>}

          <Button type="submit" disabled={register.isPending} className="mobile-auth-submit">
            {register.isPending ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>

        <div className="mobile-auth-divider"><span>ou</span></div>

        <div className="mobile-auth-social">
          <button type="button" className="mobile-social-btn">
            <span>Google</span>
          </button>
          <button type="button" className="mobile-social-btn">
            <span>Facebook</span>
          </button>
        </div>

        <div className="mobile-auth-footer">
          <p>Já tem conta? <Link to="/entrar" search={{ next: '/' }} className="mobile-auth-link">Entrar</Link></p>
        </div>
      </div>
    </div>
  )
}
