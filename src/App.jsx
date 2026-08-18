import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ShopPage from './components/ShopPage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import BlogPage from './components/BlogPage';
import PromoPage from './components/PromoPage';
import AuthPage from './components/AuthPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfilePage from './components/ProfilePage';
import ManagerPOSPage from './components/ManagerPOSPage';
import ManagerOrdersPage from './components/ManagerOrdersPage';
import ManagerCategoriesPage from './components/ManagerCategoriesPage';
import ManagerProductsPage from './components/ManagerProductsPage';
import ManagerSpeciesPage from './components/ManagerSpeciesPage';
import ManagerPetsPage from './components/ManagerPetsPage';
import ManagerReportsPage from './components/ManagerReportsPage';
import ManagerBlogsPage from './components/ManagerBlogsPage';
import ManagerReviewsPage from './components/ManagerReviewsPage';


import ManagerAccountsPage from './components/ManagerAccountsPage';
import ManagerShippersPage from './components/ManagerShippersPage';
import ManagerVouchersPage from './components/ManagerVouchersPage';
import ManagerSettingsPage from './components/ManagerSettingsPage';
import ManagerCashFlowPage from './components/ManagerCashFlowPage';
import ManagerSessionsPage from './components/ManagerSessionsPage';
import ManagerBlogCategoriesPage from './components/ManagerBlogCategoriesPage';
import BlogDetailPage from './components/BlogDetailPage';
import ContactPage from './components/ContactPage';
import PoliciesPage from './components/PoliciesPage';
import NotFoundPage from './components/NotFoundPage';
import SearchResultsPage from './components/SearchResultsPage';

import ShipperLayout from './components/ShipperLayout';
import ShipperOrdersPage from './components/ShipperOrdersPage';
import ShipperOrderDetailPage from './components/ShipperOrderDetailPage';
import ShipperEarningsPage from './components/ShipperEarningsPage';
import ShipperProfilePage from './components/ShipperProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/promo" element={<PromoPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {/* Admin/Manager Routes */}
        <Route path="/pos" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerPOSPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerOrdersPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerCategoriesPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerProductsPage /></ProtectedRoute>} />
        <Route path="/species" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerSpeciesPage /></ProtectedRoute>} />
        <Route path="/pets" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerPetsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerReportsPage /></ProtectedRoute>} />
        <Route path="/blogs" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerBlogsPage /></ProtectedRoute>} />
        <Route path="/blog-categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerBlogCategoriesPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerReviewsPage /></ProtectedRoute>} />


        <Route path="/accounts" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerAccountsPage /></ProtectedRoute>} />
        <Route path="/shippers" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerShippersPage /></ProtectedRoute>} />
        <Route path="/vouchers" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerVouchersPage /></ProtectedRoute>} />
        <Route path="/cashflow" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerCashFlowPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}><ManagerSessionsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManagerSettingsPage /></ProtectedRoute>} />

        {/* Shipper Routes */}
        <Route path="/shipper/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'SHIPPER']}><ShipperLayout><ShipperOrdersPage /></ShipperLayout></ProtectedRoute>} />
        <Route path="/shipper/order/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SHIPPER']}><ShipperOrderDetailPage /></ProtectedRoute>} />
        <Route path="/shipper/earnings" element={<ProtectedRoute allowedRoles={['ADMIN', 'SHIPPER']}><ShipperLayout><ShipperEarningsPage /></ShipperLayout></ProtectedRoute>} />
        <Route path="/shipper/profile" element={<ProtectedRoute allowedRoles={['ADMIN', 'SHIPPER']}><ShipperLayout><ShipperProfilePage /></ShipperLayout></ProtectedRoute>} />
        
        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
