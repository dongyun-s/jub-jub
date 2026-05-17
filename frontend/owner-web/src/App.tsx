import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OwnerShell } from './layouts/OwnerShell'
import {
  DashboardPage,
  MenuAddPage,
  MenuPage,
  OrdersPage,
  PaymentsPage,
  ReviewsPage,
} from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OwnerShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="menu/new" element={<MenuAddPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
