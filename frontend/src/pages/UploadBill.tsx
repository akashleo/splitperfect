import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { ParsedBill, BillItem } from '@/types'

export function UploadBill() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedBill | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('room_id', roomId!)
      
      const response = await api.post('/bills/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.image_url
    },
    onSuccess: (url) => {
      setImageUrl(url)
      if (file) {
        parseMutation.mutate(file)
      }
    },
  })

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post<ParsedBill>('/bills/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: (data) => {
      setParsedData(data)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  const handleContinue = () => {
    if (parsedData && imageUrl) {
      navigate(`/bills/edit/${roomId}`, {
        state: { parsedData, imageUrl },
      })
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/rooms/${roomId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Upload Bill</CardTitle>
          <CardDescription>Take a photo or upload an image of your receipt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bill-image">Bill Image</Label>
            <Input
              id="bill-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending || parseMutation.isPending}
            />
          </div>

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <img src={preview} alt="Bill preview" className="w-full" />
            </div>
          )}

          {!parsedData && file && !uploadMutation.isPending && !parseMutation.isPending && (
            <Button onClick={handleUpload} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload & Parse Bill
            </Button>
          )}

          {(uploadMutation.isPending || parseMutation.isPending) && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">
                {uploadMutation.isPending ? 'Uploading...' : 'Parsing bill with AI...'}
              </p>
            </div>
          )}

          {parsedData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ Bill parsed successfully!</p>
                {parsedData.merchant_name && (
                  <p className="text-sm text-green-700">Merchant: {parsedData.merchant_name}</p>
                )}
                <p className="text-sm text-green-700">
                  Found {parsedData.items.length} items • Total: ${parsedData.total_amount.toFixed(2)}
                </p>
              </div>

              <Button onClick={handleContinue} className="w-full">
                Continue to Edit Items
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
