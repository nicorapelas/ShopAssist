import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ProductRow, ShopAssistCartResponse } from '@/src/api/types'

export type ShopAssistLocalCartLine = {
  product: ProductRow
  quantity: number
}

type CartContextValue = {
  lines: ShopAssistLocalCartLine[]
  generatedCart: ShopAssistCartResponse | null
  addProduct: (product: ProductRow, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeProduct: (productId: string) => void
  clearCart: () => void
  setGeneratedCart: (cart: ShopAssistCartResponse | null) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<ShopAssistLocalCartLine[]>([])
  const [generatedCart, setGeneratedCart] = useState<ShopAssistCartResponse | null>(null)

  const markChanged = useCallback(function markChanged() {
    setGeneratedCart(null)
  }, [])

  const addProduct = useCallback(function addProduct(product: ProductRow, quantity = 1) {
    const qty = Math.max(1, Math.floor(quantity))
    markChanged()
    setLines((prev) => {
      const existing = prev.find((line) => line.product._id === product._id)
      if (existing) {
        return prev.map((line) =>
          line.product._id === product._id ? { ...line, product, quantity: line.quantity + qty } : line,
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }, [markChanged])

  const setQuantity = useCallback(function setQuantity(productId: string, quantity: number) {
    const qty = Math.max(0, Math.floor(quantity))
    markChanged()
    setLines((prev) =>
      qty < 1
        ? prev.filter((line) => line.product._id !== productId)
        : prev.map((line) => (line.product._id === productId ? { ...line, quantity: qty } : line)),
    )
  }, [markChanged])

  const removeProduct = useCallback(function removeProduct(productId: string) {
    markChanged()
    setLines((prev) => prev.filter((line) => line.product._id !== productId))
  }, [markChanged])

  const clearCart = useCallback(function clearCart() {
    setLines([])
    setGeneratedCart(null)
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      generatedCart,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      setGeneratedCart,
    }),
    [addProduct, clearCart, generatedCart, lines, removeProduct, setQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useShopAssistCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useShopAssistCart must be used within CartProvider')
  return ctx
}
