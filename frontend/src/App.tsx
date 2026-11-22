import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GuestOnly } from './components/auth/GuestOnly'
import { RequireAuth } from './components/auth/RequireAuth'
import { AdminLayout } from './components/layout/AdminLayout'
import { StorefrontLayout } from './components/layout/StorefrontLayout'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { ToastProvider } from './context/ToastContext'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { CartPage } from './pages/customer/CartPage'
import { CheckoutPage } from './pages/customer/CheckoutPage'
import { HomePage } from './pages/customer/HomePage'
import { LoginPage } from './pages/customer/LoginPage'
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage'
import { OrderDetailPage } from './pages/customer/OrderDetailPage'
import { OrdersPage } from './pages/customer/OrdersPage'
import { ProductDetailPage } from './pages/customer/ProductDetailPage'
import { ProductsPage } from './pages/customer/ProductsPage'
import { WishlistPage } from './pages/customer/WishlistPage'
import { ProfilePage } from './pages/customer/ProfilePage'
import { RegisterPage } from './pages/customer/RegisterPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { NotFoundPage } from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ShopProvider>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:slug" element={<ProductDetailPage />} />
                  <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
                  <Route path="register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="orders" element={<RequireAuth roles={['CUSTOMER']}><OrdersPage /></RequireAuth>} />
                  <Route path="orders/:id" element={<RequireAuth roles={['CUSTOMER']}><OrderDetailPage /></RequireAuth>} />
                  <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="forbidden" element={<ForbiddenPage />} />
                </Route>
                <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><AdminLayout /></RequireAuth>}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ShopProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
