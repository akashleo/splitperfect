import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { Room } from '@/types'

export function JoinRoom() {
  const navigate = useNavigate()
  const [secret, setSecret] = useState('')

  const joinMutation = useMutation({
    mutationFn: async (secret: string) => {
      const response = await api.post<Room>('/rooms/join', { secret })
      return response.data
    },
    onSuccess: (data) => {
      navigate(`/rooms/${data.id}`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to join room')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (secret.trim()) {
      joinMutation.mutate(secret)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Join Room</CardTitle>
          <CardDescription>Enter the secret code to join an existing room</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="secret">Secret Code</Label>
              <Input
                id="secret"
                placeholder="Paste the room secret code here"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="font-mono"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join Room'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
