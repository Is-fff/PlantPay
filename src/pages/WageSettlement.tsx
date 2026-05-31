import { useState, useEffect } from 'react'
import { List, NavBar, Picker } from 'antd-mobile'
import type { ProductionRecord } from '../db'
import { getAllEmployees, getAllProducts, getRecordsByMonth } from '../db'
import { getYearMonth } from '../utils'

interface EmployeeWage {
  employeeId: number
  employeeName: string
  totalQuantity: number
  totalDefective: number
  totalWage: number
  detail: {
    productId: number
    productName: string
    unitPrice: number
    quantity: number
    defective: number
    subtotal: number
  }[]
}

export default function WageSettlement() {
  const [yearMonth, setYearMonth] = useState(getYearMonth(new Date()))
  const [wages, setWages] = useState<EmployeeWage[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)

  const calculate = async () => {
    const [emps, prods, recs] = await Promise.all([
      getAllEmployees(),
      getAllProducts(),
      getRecordsByMonth(yearMonth),
    ])

    const prodMap = new Map(prods.map((p) => [p.id!, p]))
    const empMap = new Map<number, ProductionRecord[]>()

    for (const r of recs) {
      if (!empMap.has(r.employeeId)) empMap.set(r.employeeId, [])
      empMap.get(r.employeeId)!.push(r)
    }

    const result: EmployeeWage[] = []

    for (const [empId, empRecs] of empMap) {
      const emp = emps.find((e) => e.id === empId)
      const detail: EmployeeWage['detail'] = []
      const productGroups = new Map<number, ProductionRecord[]>()
      for (const r of empRecs) {
        if (!productGroups.has(r.productId)) productGroups.set(r.productId, [])
        productGroups.get(r.productId)!.push(r)
      }

      let totalQuantity = 0
      let totalDefective = 0
      let totalWage = 0

      for (const [prodId, prodRecs] of productGroups) {
        const prod = prodMap.get(prodId)
        const prodName = prod?.name || '未知'
        const unitPrice = prod?.unitPrice || 0
        const qty = prodRecs.reduce((sum, r) => sum + r.quantity, 0)
        const defective = prodRecs.reduce((sum, r) => sum + r.defectiveQuantity, 0)
        const subtotal = (qty - defective) * unitPrice
        detail.push({ productId: prodId, productName: prodName, unitPrice, quantity: qty, defective, subtotal })
        totalQuantity += qty
        totalDefective += defective
        totalWage += subtotal
      }

      result.push({
        employeeId: empId,
        employeeName: emp?.name || '未知',
        totalQuantity,
        totalDefective,
        totalWage,
        detail,
      })
    }

    setWages(result)
    setExpandedId(null)
  }

  useEffect(() => { calculate() }, [yearMonth])

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

  const grandTotal = wages.reduce((s, w) => s + w.totalWage, 0)

  return (
    <div className="page-body">
      <NavBar back={null}>工资结算</NavBar>

      <div
        style={{ padding: '8px 16px 12px' }}
        onClick={() => setPickerVisible(true)}
      >
        <div style={{
          padding: '10px 0',
          fontSize: 16,
          fontWeight: 500,
          color: '#1677ff',
          textAlign: 'center',
          border: '1px solid #1677ff',
          borderRadius: 8,
          cursor: 'pointer',
        }}>
          {yearMonth} ▼
        </div>
      </div>

      {wages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <p>该月暂无生产记录</p>
        </div>
      ) : (
        <>
          <div className="summary-card">
            <div className="summary-label">当月总工资</div>
            <div className="summary-value">¥{grandTotal.toFixed(2)}</div>
          </div>

          <List>
            {wages.map((w) => (
              <List.Item
                key={w.employeeId}
                arrow={expandedId === w.employeeId ? undefined : true}
                onClick={() => setExpandedId(expandedId === w.employeeId ? null : w.employeeId)}
                description={
                  <span>
                    合计 {w.totalQuantity} 件
                    {w.totalDefective > 0 && <span style={{ color: '#ff4d4f' }}>（不合格 {w.totalDefective} 件）</span>}
                  </span>
                }
                extra={
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
                    ¥{w.totalWage.toFixed(2)}
                  </span>
                }
              >
                {w.employeeName}
              </List.Item>
            ))}
          </List>

          {/* Expanded detail */}
          {expandedId !== null && (
            <List style={{ marginTop: 16 }} header="工资明细">
              {wages.find((w) => w.employeeId === expandedId)?.detail.map((d, i) => (
                <List.Item
                  key={i}
                  extra={
                    <span style={{ fontWeight: 600, color: '#1677ff' }}>¥{d.subtotal.toFixed(2)}</span>
                  }
                >
                  <div>
                    <span>{d.productName}</span>
                    <span style={{ fontSize: 13, color: '#999', marginLeft: 8 }}>
                      ({d.quantity}{d.defective > 0 ? `-${d.defective}` : ''}件 × ¥{d.unitPrice})
                    </span>
                  </div>
                </List.Item>
              ))}
            </List>
          )}
        </>
      )}

      <Picker
        columns={[monthOptions]}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(val) => {
          setYearMonth(String(val[0] ?? ''))
          setPickerVisible(false)
        }}
        value={[yearMonth]}
      />
    </div>
  )
}
