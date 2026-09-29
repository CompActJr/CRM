import { useState } from 'react'
import { loginLogoPath } from '../assets/assetsConfig'
import { login as loginRequest } from '../services/authService'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginRequest(email, senha)
      onLogin(data.usuario)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <img className="loginLogoImage" src={loginLogoPath} alt="Logo CRM CompAct.Jr" />
        <h1>CRM CompAct.Jr</h1>
        <label>Email</label>
        <input
          type="email"
          placeholder="usuario@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label>Senha</label>
        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          required
        />
        {error && <p className="formError">{error}</p>}
        <button type="submit" className="primaryBtn full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

export default Login
