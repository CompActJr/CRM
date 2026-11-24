import { useEffect, useState } from 'react'
import { fetchUsuariosOpcoes } from '../../services/usuariosService'
import SearchableSelect from '../common/SearchableSelect'

const FilterLabels = {
  all: 'Todos os responsáveis',
}

function FiltroResponsavel({ value, onChange, placeholder = FilterLabels.all }) {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    let active = true
    fetchUsuariosOpcoes()
      .then((data) => {
        if (active) setUsuarios(data)
      })
      .catch(() => {
        if (active) setUsuarios([])
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <SearchableSelect
      options={usuarios.map((usuario) => ({
        value: String(usuario.id),
        label: usuario.nome,
      }))}
      value={value ? String(value) : ''}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar responsável..."
      compact
    />
  )
}

export default FiltroResponsavel
