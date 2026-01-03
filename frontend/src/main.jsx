import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useAuthStore } from './store/authStore'
import { websocketService } from './services/websocket'
import ErrorBoundary from './components/ErrorBoundary'

// Initialize auth store from storage
useAuthStore.getState().initFromStorage()

// Connect to WebSocket when app starts
websocketService.connect()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)