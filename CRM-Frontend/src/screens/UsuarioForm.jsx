import { useCallback, useEffect, useMemo, useState } from 'react'
import { Save, Settings2, Target, X } from 'lucide-react'
import Field from '../components/common/Field'
import Header from '../components/layout/Header'
import ModalGerenciarCargos from '../components/usuarios/ModalGerenciarCargos'
import { useSession } from '../context/SessionContext'
import { fetchCargos } from '../services/cargosService'
import { createUsuario, fetchUsuarioById, updateUsuario, uploadUsuarioAvatar } from '../services/usuariosService'

const MetaConfigItems = [
  {
    toggleField: 'ativarMetaLeads',
    toggleLabel: 'Ativar Meta de Leads Mapeados',
    qtyField: 'quantidadeLeads',
    qtyLabel: 'Quantidade Alvo de Leads Mapeados',
    placeholder: 'Ex: 300',
  },
  {
    toggleField: 'ativarMetaEntradasContato',
    toggleLabel: 'Ativar Meta de Entradas de Contato',
    qtyField: 'quantidadeEntradasContato',
    qtyLabel: 'Quantidade Alvo de Entradas de Contato',
    placeholder: 'Ex: 80',
  },
  {
    toggleField: 'ativarMetaDiagnosticos',
    toggleLabel: 'Ativar Meta de Diagnósticos Marcados',
    qtyField: 'quantidadeDiagnosticos',
    qtyLabel: 'Quantidade Alvo de Diagnósticos Marcados',
    placeholder: 'Ex: 30',
  },
]

const EmptyForm = {
  nome: '',
  email: '',
  senha: '',
  cargo: '',
  perfil: 'Usuário',
  avatar: null,
  ativarMetaLeads: false,
  ativarMetaEntradasContato: false,
  ativarMetaDiagnosticos: false,
  quantidadeLeads: 0,
  quantidadeEntradasContato: 0,
  quantidadeDiagnosticos: 0,
  metaPeriodoInicio: '',
  metaPeriodoFim: '',
}

function UsuarioForm({ setScreen, usuarioId }) {
  const currentUser = useSession()
  const [form, setForm] = useState(EmptyForm)
  const [cargos, setCargos] = useState([])
  const [showGerenciarCargos, setShowGerenciarCargos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(usuarioId)
  const isAdmin = currentUser?.perfilAcesso === 'Administrador'

  const loadCargos = useCallback(async () => {
    try {
      const data = await fetchCargos(true)
      setCargos(data)
    } catch {
      setCargos([])
    }
  }, [])

  useEffect(() => {
    const loadFormData = async () => {
      setError('')
      try {
        await loadCargos()

        if (!usuarioId) {
          setForm({ ...EmptyForm })
          return
        }

        const usuario = await fetchUsuarioById(usuarioId)
        setForm({
          nome: usuario.nome ?? '',
          email: usuario.email ?? '',
          senha: '',
          cargo: usuario.cargo ?? '',
          perfil: usuario.perfil ?? 'Usuário',
          avatar: usuario.avatar ?? '',
          ativarMetaLeads: Boolean(usuario.ativarMetaLeads),
          ativarMetaEntradasContato: Boolean(usuario.ativarMetaEntradasContato),
          ativarMetaDiagnosticos: Boolean(usuario.ativarMetaDiagnosticos),
          quantidadeLeads: usuario.quantidadeLeads ?? 0,
          quantidadeEntradasContato: usuario.quantidadeEntradasContato ?? 0,
          quantidadeDiagnosticos: usuario.quantidadeDiagnosticos ?? 0,
          metaPeriodoInicio: usuario.metaPeriodoInicio ?? '',
          metaPeriodoFim: usuario.metaPeriodoFim ?? '',
        })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }
    loadFormData()
  }, [usuarioId, loadCargos])

  const cargoOptions = useMemo(() => {
    const nomes = cargos.map((item) => item.nome)
    if (form.cargo && !nomes.includes(form.cargo)) {
      return [form.cargo, ...nomes]
    }
    return nomes
  }, [cargos, form.cargo])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        cargo: form.cargo,
        perfil: form.perfil,
        ativarMetaLeads: Boolean(form.ativarMetaLeads),
        ativarMetaEntradasContato: Boolean(form.ativarMetaEntradasContato),
        ativarMetaDiagnosticos: Boolean(form.ativarMetaDiagnosticos),
        quantidadeLeads: Number(form.quantidadeLeads || 0),
        quantidadeEntradasContato: Number(form.quantidadeEntradasContato || 0),
        quantidadeDiagnosticos: Number(form.quantidadeDiagnosticos || 0),
        metaPeriodoInicio: form.metaPeriodoInicio || null,
        metaPeriodoFim: form.metaPeriodoFim || null,
      }
      if (form.senha.trim()) {
        payload.senha = form.senha
      }
      if (isEditing) {
        await updateUsuario(usuarioId, payload)
        if (form.avatar) {
          await uploadUsuarioAvatar(usuarioId, form.avatar)
        }
      } else {
        if (form.avatar) {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          if(!allowedTypes.includes(form.avatar.type)) {
            setError('Formato de arquivo inválido')
            return
          }
          if (form.avatar.size > 15 * 1024 * 1024) {
            setError('Tamanho de aquivo inválido (MÁX: 15MB)')
            return
          }

        }
        const usuario = await createUsuario({ ...payload, senha: form.senha })
        if (form.avatar) {
          await uploadUsuarioAvatar(usuario.id, form.avatar)
        }
      }
      setScreen('usuarios')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCargosUpdated = async () => {
    try {
      const data = await fetchCargos(true)
      setCargos(data)
      setForm((current) => {
        if (!current.cargo) return current
        const stillValid = data.some((item) => item.nome === current.cargo)
        return stillValid ? current : { ...current, cargo: '' }
      })
    } catch {
      setCargos([])
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Cadastro de Usuário" subtitle="Carregando dados do formulário" />
        <p className="tableMessage">Carregando...</p>
      </>
    )
  }

  return (
    <>
      <Header
        title={isEditing ? 'Editar Usuário' : 'Cadastro de Usuário'}
        subtitle="Defina dados, cargo e nível de acesso"
      />
      <section className="formPanel">
        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <Field
              label="Nome"
              name="nome"
              placeholder="Nome completo"
              value={form.nome}
              onChange={handleChange}
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="email@empresa.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field
              label={isEditing ? 'Nova senha (opcional)' : 'Senha'}
              name="senha"
              type="password"
              placeholder={isEditing ? 'Deixe em branco para manter' : 'Senha inicial'}
              value={form.senha}
              onChange={handleChange}
              required={!isEditing}
            />
            <label className="inputGroup">
              <span>Cargo</span>
              <select name="cargo" value={form.cargo} onChange={handleChange} required>
                <option value="">Selecione</option>
                {cargoOptions.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </label>
            {isAdmin && (
              <button
                type="button"
                className="linkBtn fullLine"
                onClick={() => setShowGerenciarCargos(true)}
              >
                <Settings2 size={16} />
                Gerenciar cargos
              </button>
            )}
            <label className="inputGroup">
              <span>Perfil de acesso</span>
              <select name="perfil" value={form.perfil} onChange={handleChange}>
                <option value="Administrador">Administrador</option>
                <option value="Usuário">Usuário</option>
              </select>
            </label>
            <label className="inputGroup">
              <span>Avatar</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                    setForm((current) => ({
                    ...current,
                    avatar: event.target.files[0] ?? null,
                }))
              }
              />
            </label>
          </div>

          {isAdmin && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-alt, #f8fafc)', borderRadius: '8px', border: '1px solid var(--color-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Target size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />
                <strong style={{ fontSize: '1rem' }}>Metas Comerciais</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {MetaConfigItems.map((metaItem) => (
                  <div key={metaItem.toggleField} className="formGrid">
                    <label className="inputGroup" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name={metaItem.toggleField}
                        checked={form[metaItem.toggleField]}
                        onChange={(e) => setForm((c) => ({ ...c, [metaItem.toggleField]: e.target.checked }))}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ margin: 0, fontWeight: 500 }}>{metaItem.toggleLabel}</span>
                    </label>

                    {form[metaItem.toggleField] && (
                      <Field
                        label={metaItem.qtyLabel}
                        name={metaItem.qtyField}
                        type="number"
                        min="0"
                        placeholder={metaItem.placeholder}
                        value={form[metaItem.qtyField]}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                ))}

                {(form.ativarMetaLeads || form.ativarMetaEntradasContato || form.ativarMetaDiagnosticos) && (
                  <>
                    <div className="formGrid">
                      <Field
                        label="Data Início da Meta (opcional)"
                        name="metaPeriodoInicio"
                        type="date"
                        value={form.metaPeriodoInicio}
                        onChange={handleChange}
                      />
                      <Field
                        label="Data Fim da Meta (opcional)"
                        name="metaPeriodoFim"
                        type="date"
                        value={form.metaPeriodoFim}
                        onChange={handleChange}
                      />
                    </div>
                    <small style={{ color: 'var(--color-text-muted, #64748b)' }}>
                      Deixe em branco para avaliar continuamente conforme o período selecionado nos painéis e relatórios.
                    </small>
                  </>
                )}
              </div>
            </div>
          )}
          {cargoOptions.length === 0 && (
            <p className="formError">
              {isAdmin
                ? 'Nenhum cargo ativo. Use "Gerenciar cargos" para cadastrar.'
                : 'Nenhum cargo disponível. Peça ao administrador cadastrar os cargos.'}
            </p>
          )}
          {error && <p className="formError">{error}</p>}
          <div className="formActions">
            <button type="button" className="secondaryBtn" onClick={() => setScreen('usuarios')}>
              <X size={18} />
              Cancelar
            </button>
            <button
              type="submit"
              className="primaryBtn"
              disabled={saving || cargoOptions.length === 0}
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </section>
      {showGerenciarCargos && isAdmin && (
        <ModalGerenciarCargos
          onClose={() => setShowGerenciarCargos(false)}
          onUpdated={handleCargosUpdated}
        />
      )}
    </>
  )
}

export default UsuarioForm
