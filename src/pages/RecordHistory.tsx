import { useState, useEffect } from 'react'
import { List, NavBar, Picker, SwipeAction, Dialog, Toast } from 'antd-mobile'
import type { Employee, Product, ProductionRecord } from '../db'
import { getAllEmployees, getAllProducts, getRecordsByMonth, deleteRecord } from '../db'
import { getYearMonth } from '../utils'

export default function RecordHistory() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [yearMonth, setYearMonth] = useState(getYearMonth(new Date()))
  const [filterEmployee, setFilterEmployee] = useState<number | null>(null)

  const [monthPicker, setMonthPicker] = useState(false)
  const [empPicker, setEmpPicker] = useState(false)

  const loadData = async () => {
    const [emps, prods, recs] = await Promise.all([
      getAllEmployees(),
      getAllProducts(),
      getRecordsByMonth(yearMonth),
    ])
    setEmployees(emps)
    setProducts(prods)
    setRecords(recs)
  }

  useEffect(() => { loadData() }, [yearMonth])

  const handleDelete = async (id: number) => {
    const result = await Dialog.confirm({
      content: '确定删除这条记录吗？',
      confirmText: '删除',
      cancelText: '取消',
    })
    if (result) {
      await deleteRecord(id)
      await loadData()
      Toast.show({ icon: 'success', content: '已删除' })
    }
  }

  const filtered = filterEmployee
    ? records.filter((r) => r.employeeId === filterEmployee)
    : records

  const getName = (id: number, list: { id?: number; name: string }[]) =>
    list.find((x) => x.id === id)?.name || '未知'

  // Generate month picker columns
  const now = new Date()
  const monthOptions = []
  for (let y = 2025; y <= now.getFullYear(); y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === now.getFullYear() && m > now.getMonth() + 1) break
      const val = `${y}-${String(m).padStart(2, '0')}`
      monthOptions.push({ label: val, value: val })
    }
  }
  monthOptions.reverse()

  const employeeOptions = [
    { label: '全部员工', value: '0' },
    ...employees.map((e) => ({ label: e.name, value: String(e.id) })),
  ]

  return (
    <div className="page-body">
      <NavBar back={null}>历史记录</NavBar>

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', marginTop: 8 }}>
        <div
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setMonthPicker(true)}
        >
          {yearMonth} ▼
        </div>
        <div
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setEmpPicker(true)}
        >
          {filterEmployee ? getName(filterEmployee, employees) : '全部员工'} ▼
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p>该筛选条件暂无记录</p>
        </div>
      ) : (
        <List>
          {filtered.map((r) => (
            <SwipeAction
              key={r.id}
              rightActions={[{
                key: 'delete',
                text: '删除',
                color: 'danger',
                onClick: () => handleDelete(r.id!),
              }]}
            >
              <List.Item
                description={
                  <span>
                    {r.date} · 合格 {r.quantity} 件
                    {r.defectiveQuantity > 0 ? <span style={{ color: '#ff4d4f' }}> · 不合格 {r.defectiveQuantity} 件</span> : ''}
                  </span>
                }
              >
                {getName(r.employeeId, employees)} - {getName(r.productId, products)}
              </List.Item>
            </SwipeAction>
          ))}
        </List>
      )}

      <Picker
        columns={[monthOptions]}
        visible={monthPicker}
        onClose={() => setMonthPicker(false)}
        onConfirm={(val) => {
          setYearMonth(String(val[0] ?? ''))
          setMonthPicker(false)
        }}
        value={[yearMonth]}
      />

      <Picker
        columns={[employeeOptions]}
        visible={empPicker}
        onClose={() => setEmpPicker(false)}
        onConfirm={(val) => {
          const v = String(val[0] ?? '0')
          setFilterEmployee(v === '0' ? null : parseInt(v))
          setEmpPicker(false)
        }}
      />
    </div>
  )
}
