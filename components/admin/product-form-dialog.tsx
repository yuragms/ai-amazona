"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct, type CreateProductResult, type UpdateProductResult } from "@/app/actions/admin-products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { UploadDropzone } from "@/lib/uploadthing"
import type { Product, Category } from "@prisma/client"
import { Loader2, X } from "lucide-react"

type ProductWithCategory = Product & { category: { name: string; slug: string } }
type CategoryOption = { id: string; name: string; slug: string }

/** Product for form: accepts price as number (serialized) or Prisma Decimal */
type ProductForForm = Omit<ProductWithCategory, "price"> & {
  price: number | { toString(): string }
}

type ProductFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryOption[]
  product?: ProductForForm | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  product,
}: ProductFormDialogProps) {
  const router = useRouter()
  const isEdit = !!product
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [categoryId, setCategoryId] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    if (open) setDragOffset({ x: 0, y: 0 })
  }, [open])

  useEffect(() => {
    if (!open) return
    setError(null)
    fetch("/api/uploadthing")
      .then((res) => {
        if (res.ok) return
        return res.json().then((body: { error?: string }) => {
          setError(body?.error ?? `Upload error: ${res.status}`)
        })
      })
      .catch(() => setError("Cannot reach upload service. Check UPLOADTHING_TOKEN in .env and restart the server."))
  }, [open])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    }
  }, [dragOffset.x, dragOffset.y])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      setDragOffset({
        x: dragStartRef.current.offsetX + (e.clientX - dragStartRef.current.mouseX),
        y: dragStartRef.current.offsetY + (e.clientY - dragStartRef.current.mouseY),
      })
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [isDragging])

  useEffect(() => {
    if (product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description ?? "")
      setPrice(String(product.price))
      setStock(String(product.stock))
      setCategoryId(product.categoryId)
      setImages(product.images ?? [])
    } else {
      setName("")
      setSlug("")
      setDescription("")
      setPrice("")
      setStock("0")
      setCategoryId(categories[0]?.id ?? "")
      setImages([])
    }
    setError(null)
  }, [product, open, categories])

  const handleNameChange = (v: string) => {
    setName(v)
    if (!isEdit) setSlug(slugify(v))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set("images", JSON.stringify(images))

    try {
      if (isEdit) {
        const result = (await updateProduct(product!.id, null, formData)) as UpdateProductResult
        if (result.ok) {
          onOpenChange(false)
          router.refresh()
        } else {
          setError(result.error ?? "Failed to update")
        }
      } else {
        const result = (await createProduct(null, formData)) as CreateProductResult
        if (result.ok) {
          onOpenChange(false)
          router.refresh()
        } else {
          setError(result.error ?? "Failed to create")
        }
      }
    } finally {
      setPending(false)
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col",
            "left-[50%] top-[50%]"
          )}
          style={{
            transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`,
          }}
        >
          <DialogHeader
            className="cursor-grab active:cursor-grabbing select-none border-b pb-2 -mx-6 px-6 -mt-6 pt-6"
            onMouseDown={handleDragStart}
          >
            <DialogTitle className="pr-8">{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <DialogClose
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogClose>
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="product-name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="categoryId" value={categoryId} />
          </div>
          <div className="space-y-2">
            <Label>Images</Label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url) => (
                  <div key={url} className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={url}
                      alt=""
                      width={80}
                      height={80}
                      className="size-full object-cover"
                      quality={65}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
                      aria-label="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 6 && (
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-4">
                <UploadDropzone
                  endpoint="productImage"
                  onClientUploadComplete={(res) => {
                    if (res) {
                      const urls = res.map((f) => f.url)
                      setImages((prev) => [...prev, ...urls].slice(0, 6))
                    }
                  }}
                  onUploadError={(err) => setError(err.message)}
                  appearance={{
                    container: "w-full cursor-pointer border-0 bg-transparent p-0 m-0 min-h-[120px] flex flex-col items-center justify-center gap-2",
                    label: "text-sm font-medium text-foreground cursor-pointer",
                    button: "ut-ready:bg-primary ut-uploading:bg-primary/50 ut-uploading:cursor-not-allowed text-primary-foreground rounded-md px-4 py-2 text-sm font-medium after:bg-primary",
                    allowedContent: "text-xs text-muted-foreground",
                  }}
                />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {images.length}/6 фото. Перетащите сюда или нажмите для загрузки. После загрузки нажмите «Сохранить» или «Создать», иначе URL не попадёт в БД.
                </p>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
