import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Users, Receipt, LogOut } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Room } from '@/types'
import { formatDate } from '@/lib/utils'

export function Home() {
  const { user, logout } = useAuthStore()

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get<Room[]>('/rooms')
      return response.data
    },
  })

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">{user?.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/rooms/create">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Create Room</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/rooms/join">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Join Room</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Rooms */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
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
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No rooms yet</p>
              <p className="text-sm text-muted-foreground">Create or join a room to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
