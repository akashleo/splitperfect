import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { Room } from '@/types'

export function CreateRoom() {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)
  const [copied, setCopied] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post<Room>('/rooms', { name })
      return response.data
    },
    onSuccess: (data) => {
      setCreatedRoom(data)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim()) {
      createMutation.mutate(roomName)
    }
  }

  const copySecret = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (createdRoom) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Room Created! 🎉</CardTitle>
            <CardDescription>Share this secret code with others to invite them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Room Name</Label>
              <p className="text-lg font-semibold">{createdRoom.name}</p>
            </div>
            <div>
              <Label>Secret Code</Label>
              <div className="flex gap-2 mt-2">
                <Input value={createdRoom.secret} readOnly className="font-mono" />
                <Button onClick={copySecret} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => navigate(`/rooms/${createdRoom.id}`)} className="w-full">
              Go to Room
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Room</CardTitle>
          <CardDescription>Start a new expense group</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="e.g., Weekend Trip, Roommates, Office Lunch"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
