import React , {useState} from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../config/Firebase'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

const PlaceholderSection =({title})=>(
  <div className='flex-1 flex items-center justify-center p-10'>
    <div className='text-center'>
      <h2 className='text-lg font-semibold text-foreground mb-1'>{title}</h2>
      <p className='text-sm text-muted-foreground'>
        This section is coming up in a later step.
      </p>
    </div>
  </div>
)
const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection]= useState('overview')
  const [sidebarOpen, setSidebarOpen]= useState(false);

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login') 
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={()=>setSidebarOpen(false)} />
      <main className='flex-1 min-w-0'>
        <Header
          activeSection={activeSection}
          onNavigate={setActiveSection}
          onNewClick={()=> alert('We will wire this up when we build Plans/Tasks!') }
          onMenuClick={()=> setSidebarOpen(true)}/>
        <div>
          {activeSection === 'overview' && <PlaceholderSection title="Overview" />}
          {activeSection === 'plans' && <PlaceholderSection title="Plans" />}
          {activeSection === 'planner' && <PlaceholderSection title="Planner" />}
          {activeSection === 'insights' && <PlaceholderSection title="Insights" />}
          {activeSection === 'knowledge' && <PlaceholderSection title="Knowledge" />}
          {activeSection === 'copilot' && <PlaceholderSection title="AI Copilot" />}
          {activeSection === 'settings' && <PlaceholderSection title="Settings" />}
        </div>
      </main>      
    </div>
  )
}

export default Dashboard