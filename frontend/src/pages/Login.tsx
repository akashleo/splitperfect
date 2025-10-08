import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Receipt } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential,
      })

      const { access_token, user } = response.data
      setAuth(user, access_token)
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
      alert('Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <Receipt className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl">SplitPerfect</CardTitle>
          <CardDescription>
            AI-powered expense sharing made simple
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in with Google to get started
          </p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.error('Login Failed')
              alert('Login failed. Please try again.')
            }}
            useOneTap
          />
        </CardContent>
      </Card>
    </div>
  )
}
