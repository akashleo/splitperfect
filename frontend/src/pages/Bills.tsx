import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import { Bill, Room } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export function Bills() {
  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get<Room[]>('/rooms')
      return response.data
    },
  })

  const { data: allBills, isLoading } = useQuery({
    queryKey: ['all-bills', rooms],
    queryFn: async () => {
      if (!rooms || rooms.length === 0) return []
      
      const billPromises = rooms.map((room) =>
        api.get<Bill[]>(`/bills/room/${room.id}`).then((res) =>
          res.data.map((bill) => ({ ...bill, roomName: room.name }))
        )
      )
      
      const billArrays = await Promise.all(billPromises)
      return billArrays.flat().sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
    enabled: !!rooms && rooms.length > 0,
  })

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">All Bills</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : allBills && allBills.length > 0 ? (
        <div className="space-y-3">
          {allBills.map((bill: any) => (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{formatCurrency(bill.total_amount)}</span>
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {bill.roomName} • {formatDate(bill.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={bill.image_url}
                  alt="Bill"
                  className="w-full rounded-lg border"
                  loading="lazy"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bills yet</p>
            <p className="text-sm text-muted-foreground">Upload a bill to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
