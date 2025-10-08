import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Receipt, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Receipt, label: 'Bills', path: '/bills' },
  { icon: Users, label: 'Rooms', path: '/rooms' },
  { icon: BarChart3, label: 'Report', path: '/report' },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
