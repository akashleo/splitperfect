import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { Room } from '@/types'
import { formatDate } from '@/lib/utils'

export function Rooms() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get<Room[]>('/rooms')
      return response.data
    },
  })

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rooms</h1>
        <div className="flex gap-2">
          <Link to="/rooms/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </Link>
          <Link to="/rooms/join">
            <Button size="sm" variant="outline">
              Join
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rooms && rooms.length > 0 ? (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{room.name}</span>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    {room.member_count} member{room.member_count !== 1 ? 's' : ''} • Created {formatDate(room.created_at)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rooms yet</p>
            <p className="text-sm text-muted-foreground">Create or join a room to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
