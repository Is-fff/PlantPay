import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Button, NavBar, Dialog, Popup, Form, Input, Toast, Tag, Space } from 'antd-mobile'
import type { Product, Color, Size } from '../db'
import { getAllProducts, addProduct, updateProduct, deleteProduct, getColorsByProduct, getSizesByProduct, addColor, addSize } from '../db'

export default function ProductManage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [colorsMap, setColorsMap] = useState<Record<number, Color[]>>({})
  const [sizesMap, setSizesMap] = useState<Record<number, Size[]>>({})

  // Product form popup
  const [popupVisible, setPopupVisible] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [remark, setRemark] = useState('')

  // Quick-add color/size popup
  const [quickAddVisible, setQuickAddVisible] = useState(false)
  const [quickAddProductId, setQuickAddProductId] = useState<number>(0)
  const [quickAddType, setQuickAddType] = useState<'color' | 'size'>('color')
  const [quickAddName, setQuickAddName] = useState('')

  const load = async () => {
    const prods = await getAllProducts()
    setProducts(prods)
    // Load colors and sizes for all products
    const cMap: Record<number, Color[]> = {}
    const sMap: Record<number, Size[]> = {}
    await Promise.all(prods.map(async (p) => {
      const [c, s] = await Promise.all([getColorsByProduct(p.id!), getSizesByProduct(p.id!)])
      cMap[p.id!] = c
      sMap[p.id!] = s
    }))
    setColorsMap(cMap)
    setSizesMap(sMap)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null); setName(''); setUnitPrice(''); setRemark(''); setPopupVisible(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p); setName(p.name); setUnitPrice(String(p.unitPrice)); setRemark(p.remark); setPopupVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !unitPrice) { Toast.show({ icon: 'fail', content: '请填写名称和单价' }); return }
    const data = { name: name.trim(), unitPrice: parseFloat(unitPrice), remark: remark.trim() }
    if (editing) { await updateProduct(editing.id!, data); Toast.show({ icon: 'success', content: '修改成功' }) }
    else { await addProduct(data); Toast.show({ icon: 'success', content: '添加成功' }) }
    setPopupVisible(false); await load()
  }

  const handleDelete = async (p: Product) => {
    const result = await Dialog.confirm({ content: `确定删除型号"${p.name}"及其所有颜色和码数？`, confirmText: '删除', cancelText: '取消' })
    if (result) { await deleteProduct(p.id!); await load(); Toast.show({ icon: 'success', content: '已删除' }) }
  }

  const openQuickAdd = (productId: number, type: 'color' | 'size') => {
    setQuickAddProductId(productId)
    setQuickAddType(type)
    setQuickAddName('')
    setQuickAddVisible(true)
  }

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) return
    if (quickAddType === 'color') await addColor({ productId: quickAddProductId, name: quickAddName.trim() })
    else await addSize({ productId: quickAddProductId, name: quickAddName.trim() })
    Toast.show({ icon: 'success', content: '已添加' })
    setQuickAddVisible(false)
    await load()
  }

  return (
    <div className="page-body">
      <NavBar back={null}>货物型号管理</NavBar>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>暂无型号</p>
          <p style={{ fontSize: 14 }}>添加型号后可为其配置颜色和码数</p>
        </div>
      ) : (
        <List style={{ marginTop: 8 }}>
          {products.map((p) => {
            const productColors = colorsMap[p.id!] || []
            const productSizes = sizesMap[p.id!] || []
            return (
              <List.Item
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                description={
                  <div>
                    <div style={{ color: '#1677ff', fontWeight: 500, marginBottom: 4 }}>
                      ¥{p.unitPrice}/件
                      {p.remark ? <span style={{ fontWeight: 400, color: '#999', marginLeft: 8 }}>{p.remark}</span> : null}
                    </div>
                    <Space wrap style={{ marginTop: 4 }}>
                      {/* Colors */}
                      {productColors.length === 0 ? (
                        <Tag color="default" fill="outline" style={{ opacity: 0.5 }}>暂无颜色</Tag>
                      ) : (
                        productColors.map((c) => (
                          <Tag key={c.id} color="primary" fill="outline">{c.name}</Tag>
                        ))
                      )}
                      <span
                        style={{ fontSize: 18, color: '#1677ff', cursor: 'pointer', lineHeight: '22px' }}
                        onClick={(e) => { e.stopPropagation(); openQuickAdd(p.id!, 'color') }}
                      >+</span>
                      <span style={{ color: '#e0e0e0', margin: '0 2px' }}>|</span>
                      {/* Sizes */}
                      {productSizes.length === 0 ? (
                        <Tag color="default" fill="outline" style={{ opacity: 0.5 }}>暂无码数</Tag>
                      ) : (
                        productSizes.map((s) => (
                          <Tag key={s.id} color="success" fill="outline">{s.name}</Tag>
                        ))
                      )}
                      <span
                        style={{ fontSize: 18, color: '#1677ff', cursor: 'pointer', lineHeight: '22px' }}
                        onClick={(e) => { e.stopPropagation(); openQuickAdd(p.id!, 'size') }}
                      >+</span>
                    </Space>
                  </div>
                }
                extra={
                  <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                    <Button size="mini" color="primary" fill="outline" onClick={() => openEdit(p)}>编辑</Button>
                    <Button size="mini" color="danger" fill="outline" onClick={() => handleDelete(p)}>删除</Button>
                  </div>
                }
              >
                {p.name}
              </List.Item>
            )
          })}
        </List>
      )}

      <div style={{ padding: 16 }}>
        <Button block color="primary" size="large" onClick={openAdd}>新增型号</Button>
      </div>

      {/* Product Form Popup */}
      <Popup visible={popupVisible} onMaskClick={() => setPopupVisible(false)} position="bottom" bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 16px' }}>{editing ? '编辑型号' : '新增型号'}</h3>
          <Form layout="horizontal">
            <Form.Item label="名称"><Input placeholder="如 M01" value={name} onChange={setName} /></Form.Item>
            <Form.Item label="单价"><Input placeholder="0.00" type="number" value={unitPrice} onChange={setUnitPrice} /></Form.Item>
            <Form.Item label="备注"><Input placeholder="备注（选填）" value={remark} onChange={setRemark} /></Form.Item>
          </Form>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button block onClick={() => setPopupVisible(false)}>取消</Button>
            <Button block color="primary" onClick={handleSave}>{editing ? '保存修改' : '确定添加'}</Button>
          </div>
        </div>
      </Popup>

      {/* Quick-add Color/Size Popup */}
      <Popup visible={quickAddVisible} onMaskClick={() => setQuickAddVisible(false)} position="bottom" bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 16px' }}>
            {products.find(p => p.id === quickAddProductId)?.name} — 添加{quickAddType === 'color' ? '颜色' : '码数'}
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
            <Button block color="primary" onClick={handleQuickAdd}>添加</Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
