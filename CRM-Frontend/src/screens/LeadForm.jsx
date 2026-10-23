import { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import Field from '../components/common/Field'
import Header from '../components/layout/Header'
import { createLead, fetchLeadById, updateLead } from '../services/leadsService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'

const EmptyForm = {
  cnpj: '',
  nome: '',
  email: '',
  telefone: '',
  empresa: '',
  cidade: '',
  nicho: '',
  observacoes: '',
  status: 'Ativo',
  dataCadastro: '',
  usuarioId: '',
}

const toInputDate = (brDate) => {
  if (!brDate) return ''
  const [day, month, year] = brDate.split('/')
  return `${year}-${month}-${day}`
}

function LeadForm({ setScreen, leadId }) {
  const [form, setForm] = useState(EmptyForm)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(Boolean(leadId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(leadId)

  useEffect(() => {
    const loadFormData = async () => {
      setError('')
      try {
        const usuariosData = await fetchUsuariosOpcoes()
        setUsuarios(usuariosData)
        if (!leadId) {
          setForm({
            ...EmptyForm,
            dataCadastro: new Date().toISOString().slice(0, 10),
          })
          setLoading(false)
          return
        }
        const lead = await fetchLeadById(leadId)
        setForm({
          cnpj: lead.cnpj ?? '',
          nome: lead.nome ?? '',
          email: lead.email ?? '',
          telefone: lead.telefone ?? '',
          empresa: lead.empresa ?? '',
          cidade: lead.cidade ?? '',
          nicho: lead.nicho ?? '',
          observacoes: lead.observacoes ?? '',
          status: lead.status ?? 'Ativo',
          dataCadastro: toInputDate(lead.dataCadastro),
          usuarioId: String(lead.usuarioId ?? ''),
        })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }
    loadFormData()
  }, [leadId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleCnpjChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 14)
    const formatted = digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\.\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
    setForm((current) => ({ ...current, cnpj: formatted }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        usuarioId: Number(form.usuarioId),
      }
      if (isEditing) {
        await updateLead(leadId, payload)
      } else {
        await createLead(payload)
      }
      setScreen('leads')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header
          title={isEditing ? 'Editar Lead' : 'Cadastro de Lead'}
          subtitle="Carregando dados do formulário"
        />
        <p className="tableMessage">Carregando...</p>
      </>
    )
  }

  return (
    <>
      <Header
        title={isEditing ? 'Editar Lead' : 'Cadastro de Lead'}
        subtitle="Informe os dados para qualificação comercial do lead"
      />
      <section className="formPanel">
        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <Field
              label="Nome"
              name="nome"
              placeholder="Nome do lead"
              value={form.nome}
              onChange={handleChange}
              required
            />
            <Field
              label="CNPJ"
              name="cnpj"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={handleCnpjChange}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="email@empresa.com"
              value={form.email}
              onChange={handleChange}
            />
            <Field
              label="Telefone"
              name="telefone"
              placeholder="(55) 99999-9999"
              value={form.telefone}
              onChange={handleChange}
            />
            <Field
              label="Empresa"
              name="empresa"
              placeholder="Nome da empresa"
              value={form.empresa}
              onChange={handleChange}
            />
            <Field
              label="Cidade"
              name="cidade"
              placeholder="Cidade"
              value={form.cidade}
              onChange={handleChange}
            />
            <Field
              label="Nicho"
              name="nicho"
              placeholder="Ex: Tecnologia, Saúde, Educação"
              value={form.nicho}
              onChange={handleChange}
            />
            <Field
              label="Data de cadastro"
              name="dataCadastro"
              type="date"
              value={form.dataCadastro}
              onChange={handleChange}
              required
            />
            <label className="inputGroup">
              <span>Responsável</span>
              <select name="usuarioId" value={form.usuarioId} onChange={handleChange} required>
                <option value="">Selecione</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="inputGroup">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
          </div>
          <label className="inputGroup fullLine">
            <span>Observações</span>
            <textarea
              name="observacoes"
              placeholder="Informações adicionais sobre o lead"
              value={form.observacoes}
              onChange={handleChange}
            />
          </label>
          {error && <p className="formError">{error}</p>}
          <div className="formActions">
            <button type="button" className="secondaryBtn" onClick={() => setScreen('leads')}>
              <X size={18} />
              Cancelar
            </button>
            <button type="submit" className="primaryBtn" disabled={saving}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Lead'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

export default LeadForm
