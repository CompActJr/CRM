import { useEffect, useState } from 'react'
import { BarChart3, BriefcaseBusiness, KanbanSquare, LayoutDashboard, Moon, Presentation, Sun, Target, UserCog, Users } from 'lucide-react'
import { isAdministrador } from '../../utils/userAccess'
import logoImage from '../../assets/Logo.png'

const THEME_STORAGE_KEY = 'color-scheme'

const getStoredScheme = () => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

const getSystemScheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

const syncColorSchemeMeta = (scheme) => {
  const meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) {
    meta.setAttribute('content', scheme ?? 'light dark')
  }
}

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['metas', Target, 'Metas'],
  ['leads', Users, 'Leads'],
  ['funil', KanbanSquare, 'Funil'],
  ['resumoFunil', Presentation, 'Resumo do Funil'],
  ['negocios', BriefcaseBusiness, 'Negócios'],
  ['relatorios', BarChart3, 'Relatórios'],
  ['usuarios', UserCog, 'Usuários', true],
]

function Sidebar({ screen, setScreen, currentUser }) {
  const visibleNavItems = navItems.filter((item) => !item[3] || isAdministrador(currentUser))
  const [storedScheme, setStoredScheme] = useState(getStoredScheme)
  const [systemScheme, setSystemScheme] = useState(getSystemScheme)

  const resolvedScheme = storedScheme ?? systemScheme
  const isDark = resolvedScheme === 'dark'

  useEffect(() => {
    syncColorSchemeMeta(storedScheme)
  }, [storedScheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const handleMediaChange = (event) => {
      setSystemScheme(event.matches ? 'dark' : 'light')
    }
    const handleStorageChange = (event) => {
      if (event.key === THEME_STORAGE_KEY) {
        setStoredScheme(event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null)
      }
    }

    mediaQuery?.addEventListener('change', handleMediaChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      mediaQuery?.removeEventListener('change', handleMediaChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleToggleTheme = () => {
    const currentSystem = getSystemScheme()
    const currentRendered = storedScheme ?? currentSystem
    const target = currentRendered === 'dark' ? 'light' : 'dark'

    if (target !== currentSystem) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, target)
      } catch {
        // Ignora erro caso armazenamento esteja bloqueado
      }
      setStoredScheme(target)
      syncColorSchemeMeta(target)
      return
    }

    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } catch {
      // Ignora erro caso armazenamento esteja bloqueado
    }
    setStoredScheme(null)
    syncColorSchemeMeta(null)
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandIcon">
          <img
            style={{ width: '100%', height: 'auto', borderRadius: '10%' }}
            src={logoImage}
            alt='logo'
          />
        </div>
        <div>
          <strong>CRM CompAct.Jr</strong>
          <span>Gestão Comercial</span>
        </div>
      </div>
      <nav>
        {visibleNavItems.map(([key, Icon, label]) => (
          <button key={key} onClick={() => setScreen(key)} className={screen === key ? 'navItem active' : 'navItem'}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebarFooter">
        <button
          type="button"
          className="navItem themeToggleBtn"
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          aria-pressed={isDark}
        >
          <span className="themeOptionLight">
            <Moon size={18} />
            <span>Modo escuro</span>
          </span>
          <span className="themeOptionDark">
            <Sun size={18} />
            <span>Modo claro</span>
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
