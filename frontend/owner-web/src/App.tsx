import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './context/AuthProvider'
import { OwnerShell } from './layouts/OwnerShell'
import {
  DashboardPage,
  StoreStatusPage,
  StoreSettingsPage,
  MenuAddPage,
  MenuPage,
  OrdersPage,
  CompletedOrdersPage,
  ReviewsPage,
} from './pages'
import { LoginPage } from './pages/auth/LoginPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { FindIdPage } from './pages/auth/FindIdPage'
import { FindPasswordPage } from './pages/auth/FindPasswordPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth pages (unprotected) */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/find-id" element={<FindIdPage />} />
          <Route path="/auth/find-password" element={<FindPasswordPage />} />

          {/* Owner pages (protected) */}
          <Route path="/" element={<RequireAuth><OwnerShell /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="sales" element={<StoreStatusPage />} />
            <Route path="orders/completed" element={<CompletedOrdersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="store" element={<StoreSettingsPage />} />
            <Route path="menu/new" element={<MenuAddPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="payments" element={<Navigate to="/dashboard" replace />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
