import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PusherProvider } from './context/PusherContext.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PusherProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:   '#161B22',
              color:        '#F0F6FC',
              border:       '1px solid #30363D',
              borderRadius: '10px',
              fontSize:     '13px',
            },
          }}
        />
      </PusherProvider>
    </AuthProvider>
  </StrictMode>,
)
