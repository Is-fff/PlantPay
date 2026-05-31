import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Picker, List, SwipeAction, Toast, Dialog, Tag, Space, Popup, Form } from 'antd-mobile'
import type { Employee, Product, Color, Size } from '../db'
import { getAllEmployees, getAllProducts, getColorsByProduct, getSizesByProduct, upsertRecord, getRecordsByDate, deleteRecord, addColor, addSize, db, type ProductionRecord } from '../db'
import { todayString } from '../utils'

export default function Home() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [todayRecords, setTodayRecords] = useState<(ProductionRecord & { employeeName?: string; productName?: string; colorName?: string; sizeName?: string })[]>([])

  const [date, setDate] = useState(todayString())
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [colorId, setColorId] = useState<number | null>(null)
  const [sizeId, setSizeId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [defectiveQty, setDefectiveQty] = useState(0)

  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerType, setPickerType] = useState<'employee' | 'product' | 'color' | 'size'>('employee')

  // Quick-add popup for colors/sizes
  const [quickAddVisible, setQuickAddVisible] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'color' | 'size'>('color')
  const [quickAddName, setQuickAddName] = useState('')

  const loadData = async () => {
    const [emps, prods, recs] = await Promise.all([
      getAllEmployees(),
      getAllProducts(),
      getRecordsByDate(date),
    ])
    setEmployees(emps)
    setProducts(prods)

    const [allColors, allSizes] = await Promise.all([
      db.colors.toArray(),
      db.sizes.toArray(),
    ])
    const enriched = recs.map((r) => ({
      ...r,
      employeeName: emps.find((e) => e.id === r.employeeId)?.name,
      productName: prods.find((p) => p.id === r.productId)?.name,
      colorName: allColors.find((c) => c.id === r.colorId)?.name,
      sizeName: allSizes.find((s) => s.id === r.sizeId)?.name,
    }))
    setTodayRecords(enriched)
  }

  useEffect(() => { loadData() }, [date])

  const refreshColorsSizes = async () => {
    if (!productId) return
    const [c, s] = await Promise.all([
      getColorsByProduct(productId),
      getSizesByProduct(productId),
    ])
    setColors(c)
    setSizes(s)
  }

  const openPicker = (type: typeof pickerType) => {
    setPickerType(type)
    setPickerVisible(true)
  }

  const openColorOrSize = (type: 'color' | 'size') => {
    if (!productId) return
    const items = type === 'color' ? colors : sizes
    if (items.length === 0) {
      // No items yet — open quick-add popup
      setQuickAddType(type)
      setQuickAddName('')
      setQuickAddVisible(true)
    } else {
      // Has items — open picker
      setPickerType(type)
      setPickerVisible(true)
    }
  }

  const handleQuickAdd = async () => {
    if (!quickAddName.trim() || !productId) return
    if (quickAddType === 'color') {
      await addColor({ productId, name: quickAddName.trim() })
    } else {
      await addSize({ productId, name: quickAddName.trim() })
    }
    // Refresh the list
    await refreshColorsSizes()
    // Select the newly added item
    const items = quickAddType === 'color' ? await getColorsByProduct(productId) : await getSizesByProduct(productId)
    const added = items[items.length - 1]
    if (quickAddType === 'color') setColorId(added.id!)
    else setSizeId(added.id!)

    setQuickAddVisible(false)
    Toast.show({ icon: 'success', content: `已添加"${quickAddName.trim()}"` })
  }

  const handlePickerConfirm = async (value: (string | number | null)[]) => {
    const selectedLabel = String(value[0] ?? '')
    if (pickerType === 'employee') {
      const emp = employees.find((e) => e.name === selectedLabel)
      if (emp) setEmployeeId(emp.id!)
    } else if (pickerType === 'product') {
      const prod = products.find((p) => p.name === selectedLabel)
      if (prod) {
        setProductId(prod.id!)
        setColorId(null)
        setSizeId(null)
        const [c, s] = await Promise.all([
          getColorsByProduct(prod.id!),
          getSizesByProduct(prod.id!),
        ])
        setColors(c)
        setSizes(s)
      }
    } else if (pickerType === 'color') {
      const c = colors.find((x) => x.name === selectedLabel)
      if (c) setColorId(c.id!)
    } else if (pickerType === 'size') {
      const s = sizes.find((x) => x.name === selectedLabel)
      if (s) setSizeId(s.id!)
    }
    setPickerVisible(false)
  }

  const handleSave = async () => {
    if (!employeeId || !productId || !colorId || !sizeId) {
      Toast.show({ icon: 'fail', content: '请填写完整信息' })
      return
    }
    if (quantity <= 0) {
      Toast.show({ icon: 'fail', content: '数量必须大于0' })
      return
    }
    await upsertRecord({ employeeId, productId, colorId, sizeId, quantity, defectiveQuantity: defectiveQty, date })
    Toast.show({ icon: 'success', content: '保存成功' })
    setQuantity(1)
    setDefectiveQty(0)
    await loadData()
  }

  const handleDeleteRecord = async (record: typeof todayRecords[0]) => {
    const result = await Dialog.confirm({ content: '确定删除这条记录吗？', confirmText: '删除', cancelText: '取消' })
    if (result) { await deleteRecord(record.id!); await loadData() }
  }

  const selectedEmployee = employees.find((e) => e.id === employeeId)
  const selectedProduct = products.find((p) => p.id === productId)
  const selectedColor = colors.find((c) => c.id === colorId)
  const selectedSize = sizes.find((s) => s.id === sizeId)

  const pickerColumns = () => {
    switch (pickerType) {
      case 'employee': return [employees.map((e) => ({ label: e.name, value: e.name }))]
      case 'product':  return [products.map((p) => ({ label: `${p.name}（¥${p.unitPrice}/件）`, value: p.name }))]
      case 'color':    return [colors.map((c) => ({ label: c.name, value: c.name }))]
      case 'size':     return [sizes.map((s) => ({ label: s.name, value: s.name }))]
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <h2>记录产量</h2>
        <div style={{ flex: 1 }} />
        <Button size="small" fill="none" color="primary" onClick={() => navigate('/products')}>
          管理货物 →
        </Button>
      </div>

      <List style={{ marginTop: 8 }} header="日期">
        <List.Item>
          <Input type="date" value={date} onChange={(val) => setDate(val)} />
        </List.Item>
      </List>

      <List header="信息">
        <List.Item
          extra={selectedEmployee?.name || <span style={{ color: '#c0c0c0' }}>点击选择</span>}
          onClick={() => openPicker('employee')}
        >
          员工
        </List.Item>
        <List.Item
          extra={selectedProduct ? `${selectedProduct.name} ¥${selectedProduct.unitPrice}` : <span style={{ color: '#c0c0c0' }}>点击选择</span>}
          onClick={() => openPicker('product')}
        >
          型号
        </List.Item>
        <List.Item
          extra={
            selectedColor?.name ??
            (!productId
              ? <span style={{ color: '#c0c0c0' }}>请先选型号</span>
              : colors.length === 0
                ? <span style={{ color: '#ff9800' }}>点击添加颜色</span>
                : <span style={{ color: '#c0c0c0' }}>点击选择</span>)
          }
          onClick={() => openColorOrSize('color')}
        >
          颜色
        </List.Item>
        <List.Item
          extra={
            selectedSize?.name ??
            (!productId
              ? <span style={{ color: '#c0c0c0' }}>请先选型号</span>
              : sizes.length === 0
                ? <span style={{ color: '#ff9800' }}>点击添加码数</span>
                : <span style={{ color: '#c0c0c0' }}>点击选择</span>)
          }
          onClick={() => openColorOrSize('size')}
        >
          码数
        </List.Item>
      </List>

      <List header="数量" style={{ marginBottom: 16 }}>
        <List.Item extra={
          <input
            type="number" inputMode="numeric" min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            style={{ width: 72, padding: '6px 8px', fontSize: 16, border: '1px solid #e0e0e0', borderRadius: 8, textAlign: 'center' }}
          />
        }>
          合格品
        </List.Item>
        <List.Item extra={
          <input
            type="number" inputMode="numeric" min={0}
            value={defectiveQty}
            onChange={(e) => setDefectiveQty(parseInt(e.target.value) || 0)}
            style={{ width: 72, padding: '6px 8px', fontSize: 16, border: '1px solid #e0e0e0', borderRadius: 8, textAlign: 'center' }}
          />
        }>
          不合格品
        </List.Item>
      </List>

      <Button block color="primary" size="large" onClick={handleSave}>保存记录</Button>

      {/* Today's Records */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 12px' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>今日记录</h3>
          <Button size="small" fill="none" color="primary" onClick={() => navigate('/records')}>查看全部 →</Button>
        </div>
        {todayRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>暂无记录</div>
        ) : (
          todayRecords.map((r) => (
            <SwipeAction key={r.id} rightActions={[{ key: 'delete', text: '删除', color: 'danger', onClick: () => handleDeleteRecord(r) }]}>
              <List.Item
                description={
                  <Space wrap>
                    <Tag color="primary" fill="outline">{r.colorName || '?'}</Tag>
                    <Tag color="success" fill="outline">{r.sizeName || '?'}</Tag>
                    <span>合格 {r.quantity} 件</span>
                    {r.defectiveQuantity > 0 && <span style={{ color: '#ff4d4f' }}>不合格 {r.defectiveQuantity} 件</span>}
                  </Space>
                }
              >
                {r.employeeName} - {r.productName}
              </List.Item>
            </SwipeAction>
          ))
        )}
      </div>

      {/* Selection Picker */}
      <Picker
        columns={pickerColumns()}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handlePickerConfirm}
        title={pickerType === 'employee' ? '选择员工' : pickerType === 'product' ? '选择型号' : pickerType === 'color' ? '选择颜色' : '选择码数'}
      />

      {/* Quick-add Popup for color/size */}
      <Popup
        visible={quickAddVisible}
        onMaskClick={() => setQuickAddVisible(false)}
        position="bottom"
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div style={{ padding: 16 }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 16px' }}>
            {selectedProduct?.name} — 添加{quickAddType === 'color' ? '颜色' : '码数'}
          </h3>
          <Form layout="horizontal">
            <Form.Item label="名称">
              <Input
                placeholder={quickAddType === 'color' ? '如：红、蓝、黑' : '如：S、M、L、XL'}
                value={quickAddName}
                onChange={setQuickAddName}
                autoFocus
              />
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button block onClick={() => setQuickAddVisible(false)}>取消</Button>
            <Button block color="primary" onClick={handleQuickAdd}>确定添加</Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
