"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tag, Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import type { Category } from "@/types"

interface CategoryFormProps {
  category?: Category | null
  onSubmit: (category: Omit<Category, "id">) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    isActive: true,
  })
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive,
      })
      setImagePreview(category.imageUrl || "")
    }
  }, [category])

  const uploadImageToCloudinary = async (file: File) => {
    const cloudinaryData = new FormData()
    cloudinaryData.append("file", file)
    cloudinaryData.append("upload_preset", "Images")
    cloudinaryData.append("asset_folder", "CategoriesImage")
    cloudinaryData.append("cloud_name", "dqoo1d1ip")
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dqoo1d1ip/image/upload`,
      {
        method: 'POST',
        body: cloudinaryData,
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.secure_url
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      setImageUploading(true)
      
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      const cloudinaryUrl = await uploadImageToCloudinary(file)
      
      updateFormData("imageUrl", cloudinaryUrl)
      
      URL.revokeObjectURL(previewUrl)
      setImagePreview(cloudinaryUrl)
      
    } catch (error: any) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
      setImagePreview("")
      updateFormData("imageUrl", "")
    } finally {
      setImageUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    updateFormData("imageUrl", "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
      }

      await onSubmit(categoryData)
    } catch (error: any) {
      console.error("Error saving category:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category Image</Label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <div className="space-y-4">
                  <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2">
                        {imageUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Click to upload image
                          </>
                        )}
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={imageUploading || loading}
                    className="sr-only"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={imageUploading || loading}
                      className="h-8 gap-1"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Enter category name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Enter category description"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateFormData("isActive", checked)}
              disabled={loading}
            />
            <Label htmlFor="isActive">Active category</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || imageUploading} 
              className="bg-gradient-to-r from-primary to-accent"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : category ? "Update Category" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
