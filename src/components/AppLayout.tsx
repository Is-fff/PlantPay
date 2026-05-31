import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { AppOutline, UnorderedListOutline, PayCircleOutline, TeamOutline } from 'antd-mobile-icons'

const tabs = [
  { key: '/', title: '记录', icon: <AppOutline style={{ fontSize: 24 }} /> },
  { key: '/records', title: '历史', icon: <UnorderedListOutline style={{ fontSize: 24 }} /> },
  { key: '/products', title: '货物', icon: <PayCircleOutline style={{ fontSize: 24 }} /> },
  { key: '/employees', title: '员工', icon: <TeamOutline style={{ fontSize: 24 }} /> },
  { key: '/wages', title: '工资', icon: <span style={{ fontSize: 24 }}>💰</span> },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentKey = tabs.find((t) => {
    if (t.key === '/') return location.pathname === '/'
    return location.pathname.startsWith(t.key)
  })?.key || '/'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={currentKey}
        onChange={(key) => navigate(key)}
        safeArea
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  )
}
