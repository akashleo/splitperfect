import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { CreateRoom } from './pages/CreateRoom'
import { JoinRoom } from './pages/JoinRoom'
import { RoomDetails } from './pages/RoomDetails'
import { UploadBill } from './pages/UploadBill'
import { EditBill } from './pages/EditBill'
import { Bills } from './pages/Bills'
import { Rooms } from './pages/Rooms'
import { Report } from './pages/Report'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="bills" element={<Bills />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="report" element={<Report />} />
            </Route>

            <Route
              path="/rooms/create"
              element={
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/join"
              element={
                <ProtectedRoute>
                  <JoinRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/:roomId"
              element={
                <ProtectedRoute>
                  <RoomDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bills/upload/:roomId"
              element={
                <ProtectedRoute>
                  <UploadBill />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bills/edit/:roomId"
              element={
                <ProtectedRoute>
                  <EditBill />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

export default App
