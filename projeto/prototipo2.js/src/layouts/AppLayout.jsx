import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <Topbar />
      <main
        className="transition-all"
        style={{ marginLeft: '240px', paddingTop: '56px' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
