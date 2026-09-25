import { BarChart3, BriefcaseBusiness, KanbanSquare, LayoutDashboard, UserCog, Users } from 'lucide-react'
import { isAdministrador } from '../../utils/userAccess'
import logoImage from '../../assets/Logo.png'

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['leads', Users, 'Leads'],
  ['funil', KanbanSquare, 'Funil'],
  ['oportunidade', BriefcaseBusiness, 'Oportunidade'],
  ['relatorios', BarChart3, 'Relatórios'],
  ['usuarios', UserCog, 'Usuários', true],
]

function Sidebar({ screen, setScreen, currentUser }) {
  const visibleNavItems = navItems.filter((item) => !item[3] || isAdministrador(currentUser))
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
    </aside>
  )
}

export default Sidebar
