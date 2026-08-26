import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = {
  title: 'Carrito — KindStyle',
}

export default function CartPage() {
  return <CartView />
}
