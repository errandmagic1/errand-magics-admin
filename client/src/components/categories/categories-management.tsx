import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Category } from "@/types";
import { DataTable } from "../ui/data-table";
import { formatDate } from "@/lib/formateDate";

interface CategoriesManagementProps {
  categories: Category[];
  loading: boolean;
  onCreateCategory: (categoryData: Omit<Category, "id">) => Promise<void>;
  onUpdateCategory: (
    id: string,
    categoryData: Partial<Category>
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoriesManagement({
  categories,
  loading,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  console.log("Categories data:", categories);

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Paginate filtered categories
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + pageSize
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
    });
    setImagePreview("");
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          ...formData,
        });
      } else {
        await onCreateCategory({
          ...formData,
        });
      }
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      isActive: category.isActive,
    });
    setImagePreview(category.imageUrl || "");
    setIsCreateDialogOpen(true);
  };

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
      
      setFormData(prev => ({ ...prev, imageUrl: cloudinaryUrl }))
      
      URL.revokeObjectURL(previewUrl)
      setImagePreview(cloudinaryUrl)
      
    } catch (error: any) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
      setImagePreview("")
      setFormData(prev => ({ ...prev, imageUrl: "" }))
    } finally {
      setImageUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setFormData(prev => ({ ...prev, imageUrl: "" }))
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await onDeleteCategory(id);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const truncateDescription = (description: string | undefined | null) => {
    if (!description || description.trim() === "") return "No description";
    return description.length > 50 
      ? description.slice(0, 50) + "..." 
      : description;
  };

  const columns = [
    {
      key: "name" as keyof Category,
      title: "Category Name",
      render: (value: any, record: Category) => ( 
        <div className="flex items-center gap-3">
          {record.imageUrl ? (
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
              <img 
                src={record.imageUrl} 
                alt={record.name} 
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-medium text-foreground">{record.name}</div>
            <div className="text-sm text-muted-foreground">
              {truncateDescription(record.description)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "isActive" as keyof Category,
      title: "Status",
      render: (value: any, record: Category) => ( 
        <Badge variant={record.isActive ? "default" : "secondary"}>
          {record.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt" as keyof Category,
      title: "Created",
      render: (value: any, record: Category) => ( 
        <div className="text-sm text-muted-foreground">
          {formatDate(record.createdAt)}
        </div>
      ),
    },
    {
      key: "updatedAt" as keyof Category,
      title: "Last Updated",
      render: (value: any, record: Category) => ( 
        <div className="text-sm text-muted-foreground">
          {formatDate(record.updatedAt)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and classifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update category information"
                  : "Add a new category to organize your products"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category Image</Label>
                {!imagePreview ? (
                  <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
                    <div className="space-y-2">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            {imageUploading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3" />
                                Click to upload
                              </>
                            )}
                          </div>
                        </Label>
                      </div>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={imageUploading || isSubmitting}
                        className="sr-only"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted border">
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
                          disabled={imageUploading || isSubmitting}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter category description"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || imageUploading}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <DataTable
        data={paginatedCategories}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredCategories.length,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onPageChange: handlePageChange,
        }}
        actions={{
          onEdit: handleEdit,
          onDelete: (category: Category) => handleDelete(category.id),
        }}
        filters={{
          search: {
            placeholder: "Search categories...",
            onSearch: setSearchValue,
          },
        }}
        emptyState={{
          title: "No categories found",
          description: "Get started by creating your first category",
          action: (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          ),
        }}
      />
    </div>
  );
}
