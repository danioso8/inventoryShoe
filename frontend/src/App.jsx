import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import SellerDashboard from './pages/SellerDashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Pricing from './pages/pricing';
import Checkout from './pages/checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PrivateRoute from './components/PrivateRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import DashboardRouter from './components/DashboardRouter';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route 
          path="/checkout/:planId" 
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          } 
        />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        
        {/* Ruta de dashboard que redirige según el rol */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          } 
        />

        {/* Dashboard Administrativo (solo owner y admin) */}
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['owner', 'admin']}>
                <Dashboard />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />

        {/* Dashboard de Vendedor (vendedor y solo_lectura) */}
        <Route 
          path="/seller/dashboard" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['vendedor', 'solo_lectura']}>
                <SellerDashboard />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />

        {/* Rutas administrativas (solo owner y admin) */}
        <Route 
          path="/usuarios" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['owner', 'admin']}>
                <Users />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/productos" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['owner', 'admin']}>
                <Products />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/facturas" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['owner', 'admin']}>
                <Dashboard />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reportes" 
          element={
            <PrivateRoute>
              <RoleProtectedRoute allowedRoles={['owner', 'admin']}>
                <Dashboard />
              </RoleProtectedRoute>
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
