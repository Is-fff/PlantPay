import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import RecordHistory from './pages/RecordHistory'
import ProductManage from './pages/ProductManage'
import ProductDetail from './pages/ProductDetail'
import EmployeeManage from './pages/EmployeeManage'
import WageSettlement from './pages/WageSettlement'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductManage />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="employees" element={<EmployeeManage />} />
          <Route path="records" element={<RecordHistory />} />
          <Route path="wages" element={<WageSettlement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
