import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { AuthCallbackPage } from './pages/AuthCallbackPage.tsx'
import { PendingPage } from './pages/PendingPage.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import { PrivateRoute } from './components/PrivateRoute.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
