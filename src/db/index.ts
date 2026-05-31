import Dexie, { type Table } from 'dexie'

export interface Employee {
  id?: number
  name: string
  remark: string
}

export interface Product {
  id?: number
  name: string
  unitPrice: number
  remark: string
}

export interface Color {
  id?: number
  productId: number
  name: string
}

export interface Size {
  id?: number
  productId: number
  name: string
}

export interface ProductionRecord {
  id?: number
  employeeId: number
  productId: number
  colorId: number
  sizeId: number
  quantity: number
  defectiveQuantity: number
  date: string // YYYY-MM-DD
  createdAt: number
}

class FactoryDB extends Dexie {
  employees!: Table<Employee, number>
  products!: Table<Product, number>
  colors!: Table<Color, number>
  sizes!: Table<Size, number>
  records!: Table<ProductionRecord, number>

  constructor() {
    super('FactoryWageDB')
    this.version(1).stores({
      employees: '++id, name',
      products: '++id, name',
      colors: '++id, productId',
      sizes: '++id, productId',
      records: '++id, employeeId, productId, date, [employeeId+productId+colorId+sizeId+date]',
    })
  }
}

export const db = new FactoryDB()

// --- Employee helpers ---
export async function getAllEmployees() {
  return db.employees.orderBy('id').toArray()
}

export async function addEmployee(e: Omit<Employee, 'id'>) {
  return db.employees.add(e)
}

export async function updateEmployee(id: number, e: Omit<Employee, 'id'>) {
  return db.employees.update(id, e)
}

export async function deleteEmployee(id: number) {
  return db.employees.delete(id)
}

export async function getEmployee(id: number) {
  return db.employees.get(id)
}

// --- Product helpers ---
export async function getAllProducts() {
  return db.products.orderBy('id').toArray()
}

export async function addProduct(p: Omit<Product, 'id'>) {
  return db.products.add(p)
}

export async function updateProduct(id: number, p: Omit<Product, 'id'>) {
  return db.products.update(id, p)
}

export async function deleteProduct(id: number) {
  // Also delete associated colors and sizes
  await db.colors.where('productId').equals(id).delete()
  await db.sizes.where('productId').equals(id).delete()
  return db.products.delete(id)
}

export async function getProduct(id: number) {
  return db.products.get(id)
}

// --- Color helpers ---
export async function getColorsByProduct(productId: number) {
  return db.colors.where('productId').equals(productId).toArray()
}

export async function addColor(c: Omit<Color, 'id'>) {
  return db.colors.add(c)
}

export async function updateColor(id: number, c: Omit<Color, 'id'>) {
  return db.colors.update(id, c)
}

export async function deleteColor(id: number) {
  return db.colors.delete(id)
}

// --- Size helpers ---
export async function getSizesByProduct(productId: number) {
  return db.sizes.where('productId').equals(productId).toArray()
}

export async function addSize(s: Omit<Size, 'id'>) {
  return db.sizes.add(s)
}

export async function updateSize(id: number, s: Omit<Size, 'id'>) {
  return db.sizes.update(id, s)
}

export async function deleteSize(id: number) {
  return db.sizes.delete(id)
}

// --- Record helpers ---
export async function getRecordsByDate(date: string) {
  return db.records.where('date').equals(date).toArray()
}

export async function getRecordsByMonth(yearMonth: string) {
  // yearMonth format: "YYYY-MM"
  return db.records
    .filter((r) => r.date.startsWith(yearMonth))
    .toArray()
}

export async function getRecordsByEmployeeMonth(employeeId: number, yearMonth: string) {
  return db.records
    .filter((r) => r.employeeId === employeeId && r.date.startsWith(yearMonth))
    .toArray()
}

/**
 * Upsert a record: if same employee+product+color+size+date exists, accumulate quantity
 */
export async function upsertRecord(r: Omit<ProductionRecord, 'id' | 'createdAt'>) {
  const existing = await db.records
    .where('[employeeId+productId+colorId+sizeId+date]')
    .equals([r.employeeId, r.productId, r.colorId, r.sizeId, r.date])
    .first()

  if (existing) {
    return db.records.update(existing.id!, {
      quantity: existing.quantity + r.quantity,
      defectiveQuantity: existing.defectiveQuantity + r.defectiveQuantity,
    })
  } else {
    return db.records.add({
      ...r,
      createdAt: Date.now(),
    })
  }
}

export async function deleteRecord(id: number) {
  return db.records.delete(id)
}

export async function updateRecord(id: number, r: Partial<ProductionRecord>) {
  return db.records.update(id, r)
}

// --- Export / Import ---
export async function exportAllData() {
  const [employees, products, colors, sizes, records] = await Promise.all([
    db.employees.toArray(),
    db.products.toArray(),
    db.colors.toArray(),
    db.sizes.toArray(),
    db.records.toArray(),
  ])
  return { employees, products, colors, sizes, records }
}

export async function importAllData(data: {
  employees: Employee[]
  products: Product[]
  colors: Color[]
  sizes: Size[]
  records: ProductionRecord[]
}) {
  await db.employees.clear()
  await db.products.clear()
  await db.colors.clear()
  await db.sizes.clear()
  await db.records.clear()
  await db.employees.bulkAdd(data.employees)
  await db.products.bulkAdd(data.products)
  await db.colors.bulkAdd(data.colors)
  await db.sizes.bulkAdd(data.sizes)
  await db.records.bulkAdd(data.records)
}

export async function clearAllData() {
  await db.employees.clear()
  await db.products.clear()
  await db.colors.clear()
  await db.sizes.clear()
  await db.records.clear()
}
