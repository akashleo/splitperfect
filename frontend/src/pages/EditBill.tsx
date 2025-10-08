import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import api from '@/lib/api'
import { Room, BillItem, ParsedBill } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function EditBill() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { parsedData, imageUrl } = location.state as { parsedData: ParsedBill; imageUrl: string }

  const [items, setItems] = useState<BillItem[]>([])

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const response = await api.get<Room>(`/rooms/${roomId}`)
      return response.data
    },
  })

  useEffect(() => {
    if (parsedData && room) {
      const initialItems: BillItem[] = parsedData.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.total,
        shared_by: room.members?.map((m) => m.id) || [],
      }))
      setItems(initialItems)
    }
  }, [parsedData, room])

  const saveMutation = useMutation({
    mutationFn: async (items: BillItem[]) => {
      const response = await api.post('/bills/items', null, {
        params: {
          room_id: roomId,
          image_url: imageUrl,
        },
        data: items,
      })
      return response.data
    },
    onSuccess: () => {
      navigate(`/rooms/${roomId}`)
    },
  })

  const toggleMember = (itemIndex: number, userId: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex) {
          const shared = item.shared_by.includes(userId)
            ? item.shared_by.filter((id) => id !== userId)
            : [...item.shared_by, userId]
          return { ...item, shared_by: shared }
        }
        return item
      })
    )
  }

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            updated.amount = updated.quantity * updated.unit_price
          }
          return updated
        }
        return item
      })
    )
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        shared_by: room?.members?.map((m) => m.id) || [],
      },
    ])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/rooms/${roomId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Bill Items</CardTitle>
          <CardDescription>Review and assign items to members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input value={formatCurrency(item.amount)} disabled />
                </div>
              </div>

              <div>
                <Label>Shared by</Label>
                <div className="space-y-2 mt-2">
                  {room?.members?.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={item.shared_by.includes(member.id)}
                        onCheckedChange={() => toggleMember(index, member.id)}
                      />
                      <label className="text-sm">{member.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Button onClick={addItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate(items)}
            disabled={saveMutation.isPending || items.length === 0}
            className="w-full"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Bill'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
