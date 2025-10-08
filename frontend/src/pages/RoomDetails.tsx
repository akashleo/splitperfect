import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, Upload, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { Room } from '@/types'
import { formatDate } from '@/lib/utils'

export function RoomDetails() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const response = await api.get<Room>(`/rooms/${roomId}`)
      return response.data
    },
  })

  const copySecret = () => {
    if (room) {
      navigator.clipboard.writeText(room.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <p>Loading...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <p>Room not found</p>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{room.name}</CardTitle>
          <CardDescription>Created {formatDate(room.created_at)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Room Secret</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                {room.secret}
              </code>
              <Button onClick={copySecret} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Members ({room.members?.length || 0})</p>
            <div className="space-y-2">
              {room.members?.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 bg-muted rounded-md">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {member.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => navigate(`/bills/upload/${roomId}`)} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Upload Bill
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
