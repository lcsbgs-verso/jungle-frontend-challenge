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
            placeholder="contato@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <Field
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="***********"
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
          
          <div className="mobile-forgot-password">
            <a href="#esqueci-senha" className="mobile-forgot-link">Esqueceu a senha?</a>
          </div>

          {login.isError && <Notice kind="error">{problem(login.error).message}</Notice>}

          <Button type="submit" disabled={login.isPending} className="mobile-auth-submit">
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mobile-auth-divider"><span>Ou continue com</span></div>

        <div className="mobile-auth-social-stacked">
          <button type="button" className="mobile-social-btn-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.1 10.2C18.1 9.6 18 9 17.9 8.5H10V11.7H14.5C14.3 12.8 13.7 13.7 12.8 14.3V16.4H15.6C17.1 15 18.1 12.8 18.1 10.2Z" fill="#4285F4"/>
              <path d="M10 18.5C12.3 18.5 14.2 17.7 15.6 16.4L12.8 14.3C12 14.8 11 15.1 10 15.1C7.8 15.1 6 13.7 5.3 11.8H2.4V13.9C3.8 16.7 6.7 18.5 10 18.5Z" fill="#34A853"/>
              <path d="M5.3 11.8C5.1 11.2 5 10.6 5 10C5 9.4 5.1 8.8 5.3 8.2V6.1H2.4C1.8 7.3 1.5 8.6 1.5 10C1.5 11.4 1.8 12.7 2.4 13.9L5.3 11.8Z" fill="#FBBC04"/>
              <path d="M10 4.9C11.1 4.9 12.1 5.3 12.9 6L15.4 3.5C14.2 2.4 12.3 1.5 10 1.5C6.7 1.5 3.8 3.3 2.4 6.1L5.3 8.2C6 6.3 7.8 4.9 10 4.9Z" fill="#EA4335"/>
            </svg>
            <span>Continuar com Google</span>
          </button>
          <button type="button" className="mobile-social-btn-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#1877F2">
              <path d="M20 10C20 4.5 15.5 0 10 0S0 4.5 0 10c0 5 3.7 9.1 8.4 9.9v-7H5.9V10h2.5V7.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V10h2.8l-.4 2.9h-2.3v7C16.3 19.1 20 15 20 10z"/>
            </svg>
            <span>Continuar com Facebook</span>
          </button>
        </div>

        <div className="mobile-auth-footer">
          <p>Novo na Kurio? <Link to="/cadastro" search={{ next: '/' }} className="mobile-auth-link">Crie uma conta</Link></p>
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
            placeholder="contato@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <Field
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="***********"
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

        <div className="mobile-auth-divider"><span>Ou continue com</span></div>

        <div className="mobile-auth-social-stacked">
          <button type="button" className="mobile-social-btn-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.1 10.2C18.1 9.6 18 9 17.9 8.5H10V11.7H14.5C14.3 12.8 13.7 13.7 12.8 14.3V16.4H15.6C17.1 15 18.1 12.8 18.1 10.2Z" fill="#4285F4"/>
              <path d="M10 18.5C12.3 18.5 14.2 17.7 15.6 16.4L12.8 14.3C12 14.8 11 15.1 10 15.1C7.8 15.1 6 13.7 5.3 11.8H2.4V13.9C3.8 16.7 6.7 18.5 10 18.5Z" fill="#34A853"/>
              <path d="M5.3 11.8C5.1 11.2 5 10.6 5 10C5 9.4 5.1 8.8 5.3 8.2V6.1H2.4C1.8 7.3 1.5 8.6 1.5 10C1.5 11.4 1.8 12.7 2.4 13.9L5.3 11.8Z" fill="#FBBC04"/>
              <path d="M10 4.9C11.1 4.9 12.1 5.3 12.9 6L15.4 3.5C14.2 2.4 12.3 1.5 10 1.5C6.7 1.5 3.8 3.3 2.4 6.1L5.3 8.2C6 6.3 7.8 4.9 10 4.9Z" fill="#EA4335"/>
            </svg>
            <span>Continuar com Google</span>
          </button>
          <button type="button" className="mobile-social-btn-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#1877F2">
              <path d="M20 10C20 4.5 15.5 0 10 0S0 4.5 0 10c0 5 3.7 9.1 8.4 9.9v-7H5.9V10h2.5V7.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V10h2.8l-.4 2.9h-2.3v7C16.3 19.1 20 15 20 10z"/>
            </svg>
            <span>Continuar com Facebook</span>
          </button>
        </div>

        <div className="mobile-auth-footer">
          <p>Já tem uma conta? <Link to="/entrar" search={{ next: '/' }} className="mobile-auth-link">Entrar</Link></p>
        </div>
      </div>
    </div>
  )
}
