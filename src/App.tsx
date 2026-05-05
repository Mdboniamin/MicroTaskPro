/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerDashboard from './pages/dashboard/worker/WorkerDashboard';
import BuyerDashboard from './pages/dashboard/buyer/BuyerDashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Notifications from './pages/Notifications';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/dashboard/worker/*" element={
                    <RoleBasedRoute allowedRole="worker">
                      <WorkerDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/dashboard/buyer/*" element={
                    <RoleBasedRoute allowedRole="buyer">
                      <BuyerDashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="/dashboard/admin/*" element={
                    <RoleBasedRoute allowedRole="admin">
                      <AdminDashboard />
                    </RoleBasedRoute>
                  } />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

