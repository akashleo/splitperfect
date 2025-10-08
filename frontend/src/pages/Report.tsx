import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { Room, RoomSummary } from '@/types'
import { formatCurrency } from '@/lib/utils'
import jsPDF from 'jspdf'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function Report() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get<Room[]>('/rooms')
      return response.data
    },
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return null
      const response = await api.get<RoomSummary>(`/rooms/${selectedRoomId}/summary`)
      return response.data
    },
    enabled: !!selectedRoomId,
  })

  const downloadPDF = () => {
    if (!summary) return

    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text(summary.room_name, 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Total Expenses: ${formatCurrency(summary.total_expenses)}`, 20, 35)
    
    doc.setFontSize(14)
    doc.text('Settlement Summary', 20, 50)
    
    doc.setFontSize(10)
    let y = 60
    summary.transactions.forEach((txn) => {
      doc.text(
        `${txn.from_user_name} pays ${txn.to_user_name}: ${formatCurrency(txn.amount)}`,
        20,
        y
      )
      y += 10
    })
    
    doc.save(`${summary.room_name}-report.pdf`)
  }

  // Prepare chart data
  const balanceData = summary?.balances.map((b) => ({
    name: b.user_name,
    paid: b.total_paid,
    owed: b.total_owed,
  })) || []

  const pieData = summary?.balances.map((b) => ({
    name: b.user_name,
    value: b.total_paid,
  })) || []

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Room</CardTitle>
          <CardDescription>Choose a room to view its expense report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rooms?.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Loading report...</p>}

      {summary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Summary</span>
                <Button onClick={downloadPDF} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_expenses)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Settlement Transactions</p>
                {summary.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {summary.transactions.map((txn, idx) => (
                      <div key={idx} className="bg-muted p-3 rounded-lg">
                        <p className="font-medium">
                          {txn.from_user_name} → {txn.to_user_name}
                        </p>
                        <p className="text-lg text-primary">{formatCurrency(txn.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">All settled up! 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paid vs Owed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="paid" fill="#0088FE" name="Paid" />
                  <Bar dataKey="owed" fill="#00C49F" name="Owed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
