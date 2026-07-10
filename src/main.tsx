import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { NotificationsProvider } from '@/features/notifications/context/NotificationsContext'

const queryClient = new QueryClient()

// NotificationsProvider AuthProvider'ın İÇİNDE olmalı: WebSocket bileti oturum
// token'ıyla alınır ve `account.suspended` geldiğinde logout() çağırır.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)