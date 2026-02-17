"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { AddressRecord } from "@/app/actions/address"
import { createAddress, updateAddress } from "@/app/actions/address"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const schema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, "Укажите улицу"),
  city: z.string().min(1, "Укажите город"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Укажите индекс"),
  country: z.string().min(1, "Укажите страну"),
  isDefault: z.boolean().optional(),
})

type Values = z.infer<typeof schema>

type AddressFormDialogProps = {
  address?: AddressRecord | null
  trigger: React.ReactNode
}

export function AddressFormDialog({ address, trigger }: AddressFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: address
      ? {
          label: address.label ?? "",
          street: address.street,
          city: address.city,
          state: address.state ?? "",
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        }
      : {
          label: "",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
          isDefault: false,
        },
  })

  async function onSubmit(values: Values) {
    setError("")
    if (address) {
      const result = await updateAddress(address.id, {
        label: values.label,
        street: values.street,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
        isDefault: values.isDefault,
      })
      if (result.ok) {
        setOpen(false)
        form.reset()
      } else {
        setError(result.error)
      }
    } else {
      const result = await createAddress({
        label: values.label,
        street: values.street,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
        isDefault: values.isDefault,
      })
      if (result.ok) {
        setOpen(false)
        form.reset({ label: "", street: "", city: "", state: "", postalCode: "", country: "", isDefault: false })
      } else {
        setError(result.error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Редактировать адрес" : "Новый адрес"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Метка (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="Дом, Работа" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Улица</FormLabel>
                  <FormControl>
                    <Input placeholder="ул. Примерная, 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Город</FormLabel>
                    <FormControl>
                      <Input placeholder="Москва" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Регион</FormLabel>
                    <FormControl>
                      <Input placeholder="МО" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Индекс</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Страна</FormLabel>
                    <FormControl>
                      <Input placeholder="Россия" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Использовать по умолчанию</FormLabel>
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {address ? "Сохранить" : "Добавить"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
