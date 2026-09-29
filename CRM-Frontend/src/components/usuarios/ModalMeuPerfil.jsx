import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import Field from '../common/Field'
import { getPerfilLabel, getUserInitials } from '../../utils/userDisplay'
import {
  deleteUsuarioAvatar,
  updateUsuario,
  uploadUsuarioAvatar,
} from '../../services/usuariosService'

function ModalMeuPerfil({ currentUser, onClose, onUpdateUser }) {
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nome: currentUser?.nome ?? '',
    email: currentUser?.email ?? '',
    cargo: currentUser?.cargo ?? '',
    senha: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Limpa o input para permitir selecionar o mesmo arquivo novamente se desejar
    event.target.value = ''

    if (file.size > 15 * 1024 * 1024) {
      setError('A foto deve ter no máximo 15MB.')
      return
    }

    setUploadingAvatar(true)
    setError('')
    setSuccess('')
    try {
      const updatedUser = await uploadUsuarioAvatar(currentUser.id, file)
      onUpdateUser?.(updatedUser)
      setAvatarError(false)
      setSuccess('Foto de perfil atualizada.')
    } catch (requestError) {
      setError(requestError.message || 'Erro ao enviar foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    const confirmed = window.confirm('Deseja remover sua foto de perfil?')
    if (!confirmed) return

    setUploadingAvatar(true)
    setError('')
    setSuccess('')
    try {
      const updatedUser = await deleteUsuarioAvatar(currentUser.id)
      onUpdateUser?.(updatedUser)
      setAvatarError(false)
      setSuccess('Foto de perfil removida.')
    } catch (requestError) {
      setError(requestError.message || 'Erro ao remover foto de perfil.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        cargo: form.cargo.trim(),
        perfil: currentUser.perfilAcesso,
      }

      if (form.senha.trim()) {
        payload.senha = form.senha
      }

      const updated = await updateUsuario(currentUser.id, payload)

      const updatedUser = {
        ...currentUser,
        nome: updated?.nome || payload.nome,
        email: updated?.email || payload.email,
        cargo: updated?.cargo || payload.cargo,
        avatarUrl: updated?.avatarUrl ?? currentUser.avatarUrl,
      }

      onUpdateUser?.(updatedUser)
      setSuccess('Informações atualizadas.')
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (requestError) {
      setError(requestError.message || 'Erro ao atualizar dados do perfil.')
    } finally {
      setSaving(false)
    }
  }

  const showAvatarImage = currentUser?.avatarUrl && !avatarError

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meuPerfilTitle"
    >
      <div className="modalCard modalCardWide">
        <div className="modalHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 id="meuPerfilTitle">Meu Perfil</h3>
            <span className="tag ok" style={{ fontSize: '11px' }}>
              {getPerfilLabel(currentUser?.perfilAcesso)}
            </span>
          </div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Seção Elegante de Perfil e Avatar */}
        <div className="profileHeaderRow">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/webp, image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <div
            className="avatarInteractive"
            onClick={handleSelectFile}
            title="Clique para trocar de foto"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelectFile()}
          >
            <div className="avatar avatarMedium">
              {showAvatarImage ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.nome}
                  className="avatarImg"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                getUserInitials(currentUser?.nome)
              )}
              <div className="avatarHoverOverlay" aria-hidden="true">
                <Camera size={18} />
              </div>
            </div>
            <div className="avatarBadgeBtn" aria-hidden="true">
              <Camera size={12} />
            </div>
            {uploadingAvatar && (
              <div className="avatarLoadingOverlay">
                <Loader2 size={20} className="spinning" />
              </div>
            )}
          </div>

          <div className="profileHeaderMeta">
            <div className="profileHeaderTitleRow">
              <h4>{currentUser?.nome || 'Meu Perfil'}</h4>
              <span className="tag ok" style={{ fontSize: '11px' }}>
                {getPerfilLabel(currentUser?.perfilAcesso)}
              </span>
            </div>
            <span className="profileHeaderEmail">{currentUser?.email}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px' }}>
              <button
                type="button"
                className="profileChangePhotoLink"
                onClick={handleSelectFile}
                disabled={uploadingAvatar || saving}
              >
                <Camera size={13} />
                <span>{uploadingAvatar ? 'Enviando...' : showAvatarImage ? 'Trocar foto' : 'Adicionar foto'}</span>
              </button>

              {showAvatarImage && (
                <button
                  type="button"
                  className="profileChangePhotoLink profileRemovePhotoLink"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar || saving}
                >
                  <Trash2 size={12} />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="formError">{error}</p>}
        {success && (
          <div className="profileModalSuccess">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="formGrid" style={{ marginTop: '14px' }}>
            <Field
              label="Nome Completo"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Seu nome"
              required
              disabled={saving}
            />

            <Field
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu.email@empresa.com"
              required
              disabled={saving}
            />

            <Field
              label="Cargo"
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              placeholder="Ex.: Executivo de Vendas"
              disabled={saving}
            />

            <Field
              label="Nova Senha"
              name="senha"
              type="password"
              value={form.senha}
              onChange={handleChange}
              placeholder="Deixe em branco para manter a atual"
              disabled={saving}
            />
          </div>

          <div className="modalActions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="secondaryBtn"
              onClick={onClose}
              disabled={saving || uploadingAvatar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primaryBtn"
              disabled={saving || uploadingAvatar || !form.nome.trim() || !form.email.trim()}
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMeuPerfil
