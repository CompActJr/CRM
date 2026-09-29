import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import Header from '../components/layout/Header'
import { deleteUsuario, fetchUsuarios } from '../services/usuariosService'
import {defaultAvatarPath} from "../assets/assetsConfig";

function Usuarios({ setScreen, onNewUsuario, onEditUsuario }) {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsuarios()
      setUsuarios(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const filteredUsuarios = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return usuarios
    return usuarios.filter(
      (usuario) =>
        usuario.nome?.toLowerCase().includes(term) ||
        usuario.email?.toLowerCase().includes(term) ||
        usuario.cargo?.toLowerCase().includes(term)
    )
  }, [usuarios, search])

  const handleDelete = async (usuario) => {
    const confirmed = window.confirm(`Excluir o usuário "${usuario.nome}"?`)
    if (!confirmed) return
    try {
      await deleteUsuario(usuario.id)
      await loadUsuarios()
    } catch (requestError) {
      window.alert(requestError.message)
    }
  }

  return (
    <>
      <Header title="Usuários" subtitle="Controle de usuários, cargos e níveis de acesso" />
      <div className="toolbar">
        <div className="searchBox">
          <Search size={18} />
          <input
            placeholder="Buscar usuário..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button onClick={onNewUsuario} className="primaryBtn">
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>
      {error && <p className="formError">{error}</p>}
      <div className="tableCard">
        {loading ? (
          <p className="tableMessage">Carregando usuários...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="tableMessage">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <span className="avatar">
                        <img src={usuario.avatarUrl || defaultAvatarPath} alt={`Avatar de ${usuario.nome}`} />
                      </span>
                    </td>
                    <td>{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.cargo}</td>
                    <td>
                      <span className={usuario.perfil === 'Administrador' ? 'tag admin' : 'tag'}>
                        {usuario.perfil}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                      <Edit size={16} onClick={() => onEditUsuario(usuario.id)} />
                      <Trash2 size={16} onClick={() => handleDelete(usuario)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default Usuarios
