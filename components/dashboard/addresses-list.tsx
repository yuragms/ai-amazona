"use client"

import { useState } from "react"
import type { AddressRecord } from "@/app/actions/address"
import { setDefaultAddress, deleteAddress } from "@/app/actions/address"
import { Button } from "@/components/ui/button"
import { AddressFormDialog } from "@/components/dashboard/address-form-dialog"
import { Loader2, MapPin, Pencil, Star, Trash2 } from "lucide-react"

type AddressesListProps = {
  addresses: AddressRecord[]
}

export function AddressesList({ addresses }: AddressesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [defaultingId, setDefaultingId] = useState<string | null>(null)

  async function handleSetDefault(id: string) {
    setDefaultingId(id)
    await setDefaultAddress(id)
    setDefaultingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить этот адрес?")) return
    setDeletingId(id)
    await deleteAddress(id)
    setDeletingId(null)
  }

  if (addresses.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Нет сохранённых адресов. Добавьте адрес для быстрого оформления заказов.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {addresses.map((addr) => (
        <li
          key={addr.id}
          className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {addr.label && (
                <span className="font-medium">{addr.label}</span>
              )}
              {addr.isDefault && (
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Star className="size-3 fill-current" />
                  По умолчанию
                </span>
              )}
            </div>
            <address className="mt-1 text-sm not-italic text-muted-foreground">
              {addr.street}, {addr.city}
              {addr.state ? `, ${addr.state}` : ""} {addr.postalCode}, {addr.country}
            </address>
          </div>
          <div className="flex items-center gap-2">
            {!addr.isDefault && (
              <Button
                variant="outline"
                size="sm"
                disabled={!!defaultingId}
                onClick={() => handleSetDefault(addr.id)}
              >
                {defaultingId === addr.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <MapPin className="size-4" />
                    По умолчанию
                  </>
                )}
              </Button>
            )}
            <AddressFormDialog
              address={addr}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={!!deletingId}
              onClick={() => handleDelete(addr.id)}
            >
              {deletingId === addr.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
