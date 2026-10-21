export interface Base { id: string; createdAt: string; updatedAt: string; demo?: boolean }
export interface Product extends Base { sku: string; name: string; cost: number; price: number; reorder: number }
export type MoveType = 'in' | 'out'
export interface Movement extends Base {
  productId: string; type: MoveType; qty: number
  /** landed cost per unit (in) or cost of goods per unit at time of sale (out) */
  unitCost: number
  /** sale price per unit (out only) */
  unitPrice: number
  retailer: string; date: string; containerId?: string; note?: string
}
export interface ContainerItem { productId: string; qty: number; unitCost: number; landed?: number }
export interface Container extends Base { ref: string; date: string; freight: number; duty: number; items: ContainerItem[] }
export interface DB { products: Product[]; movements: Movement[]; containers: Container[] }
export const COLLECTIONS = ['products', 'movements', 'containers'] as const
export type Collection = (typeof COLLECTIONS)[number]
export const emptyDB = (): DB => ({ products: [], movements: [], containers: [] })
