"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type AddressRecord = {
  id: string
  label: string | null
  street: string
  city: string
  state: string | null
  postalCode: string
  country: string
  isDefault: boolean
}

export async function getAddresses(): Promise<AddressRecord[] | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const list = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
  return list
}

export type CreateAddressInput = {
  label?: string
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
  isDefault?: boolean
}

export type CreateAddressResult =
  | { ok: true; addressId: string }
  | { ok: false; error: string }

export async function createAddress(
  input: CreateAddressInput
): Promise<CreateAddressResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Войдите в аккаунт." }
  }

  const { street, city, state, postalCode, country } = input
  if (!street?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
    return { ok: false, error: "Заполните обязательные поля: улица, город, индекс, страна." }
  }

  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      label: input.label?.trim() || null,
      street: street.trim(),
      city: city.trim(),
      state: state?.trim() || null,
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault: input.isDefault ?? false,
    },
  })

  revalidatePath("/checkout")
  return { ok: true, addressId: address.id }
}
