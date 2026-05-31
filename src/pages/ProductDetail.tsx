import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { List, Button, NavBar, Dialog, Popup, Form, Input, Toast, Tag, Space } from 'antd-mobile'
import type { Product, Color, Size } from '../db'
import { getProduct, getColorsByProduct, getSizesByProduct, addColor, updateColor, deleteColor, addSize, updateSize, deleteSize } from '../db'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [colors, setColors] = useState<Color[]>([])
  const [sizes, setSizes] = useState<Size[]>([])

  const [popupVisible, setPopupVisible] = useState(false)
  const [popupType, setPopupType] = useState<'color' | 'size'>('color')
  const [editItem, setEditItem] = useState<Color | Size | null>(null)
  const [itemName, setItemName] = useState('')

  const load = async () => {
    const pid = parseInt(id!)
    const [p, c, s] = await Promise.all([
      getProduct(pid),
      getColorsByProduct(pid),
      getSizesByProduct(pid),
    ])
    setProduct(p || null)
    setColors(c)
    setSizes(s)
  }

  useEffect(() => { load() }, [id])

  const openAdd = (type: 'color' | 'size') => {
    setEditItem(null)
    setItemName('')
    setPopupType(type)
    setPopupVisible(true)
  }

  const openEdit = (type: 'color' | 'size', item: Color | Size) => {
    setEditItem(item)
    setItemName(item.name)
    setPopupType(type)
    setPopupVisible(true)
  }

  const handleSave = async () => {
    if (!itemName.trim()) {
      Toast.show({ icon: 'fail', content: '请输入名称' })
      return
    }
    const pid = parseInt(id!)
    if (editItem) {
      if (popupType === 'color') {
        await updateColor(editItem.id!, { productId: pid, name: itemName.trim() })
      } else {
        await updateSize(editItem.id!, { productId: pid, name: itemName.trim() })
      }
      Toast.show({ icon: 'success', content: '修改成功' })
    } else {
      if (popupType === 'color') {
        await addColor({ productId: pid, name: itemName.trim() })
      } else {
        await addSize({ productId: pid, name: itemName.trim() })
      }
      Toast.show({ icon: 'success', content: '添加成功' })
    }
    setPopupVisible(false)
    await load()
  }

  const handleDelete = async (type: 'color' | 'size', itemId: number) => {
    const result = await Dialog.confirm({
      content: '确定删除吗？',
      confirmText: '删除',
      cancelText: '取消',
    })
    if (result) {
      if (type === 'color') await deleteColor(itemId)
      else await deleteSize(itemId)
      await load()
    }
  }

  if (!product) {
    return <div style={{ padding: 32, textAlign: 'center' }}>加载中...</div>
  }

  return (
    <div className="page-body">
      <NavBar onBack={() => navigate('/products')}>
        {product.name}
      </NavBar>

      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff', marginTop: 8 }}>
          ¥{product.unitPrice}
        </div>
        <div style={{ fontSize: 13, color: '#999' }}>每件单价</div>
        {product.remark && <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>备注：{product.remark}</div>}
      </div>

      {/* Colors */}
      <List header="颜色">
        {colors.length === 0 ? (
          <List.Item disabled>暂无颜色</List.Item>
        ) : (
          <List.Item>
            <Space wrap>
              {colors.map((c) => (
                <Tag
                  key={c.id}
                  color="primary"
                  fill="outline"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openEdit('color', c)}
                >
                  {c.name} ✎
                </Tag>
              ))}
            </Space>
          </List.Item>
        )}
      </List>
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <Button size="small" color="primary" fill="outline" onClick={() => openAdd('color')}>+ 添加颜色</Button>
      </div>

      {/* Sizes */}
      <List header="码数">
        {sizes.length === 0 ? (
          <List.Item disabled>暂无码数</List.Item>
        ) : (
          <List.Item>
            <Space wrap>
              {sizes.map((s) => (
                <Tag
                  key={s.id}
                  color="success"
                  fill="outline"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openEdit('size', s)}
                >
                  {s.name} ✎
                </Tag>
              ))}
            </Space>
          </List.Item>
        )}
      </List>
      <div style={{ padding: '0 16px' }}>
        <Button size="small" color="primary" fill="outline" onClick={() => openAdd('size')}>+ 添加码数</Button>
      </div>

      <Popup
        visible={popupVisible}
        onMaskClick={() => setPopupVisible(false)}
        position="bottom"
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div style={{ padding: 16 }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 16px' }}>
            {editItem ? '编辑' : '添加'}{popupType === 'color' ? '颜色' : '码数'}
          </h3>
          <Form layout="horizontal">
            <Form.Item label="名称">
              <Input
                placeholder={popupType === 'color' ? '如：红' : '如：XL'}
                value={itemName}
                onChange={setItemName}
              />
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button block onClick={() => setPopupVisible(false)}>取消</Button>
            <Button block color="primary" onClick={handleSave}>
              {editItem ? '保存修改' : '确定添加'}
            </Button>
          </div>
          {editItem && (
            <div style={{ marginTop: 12 }}>
              <Button block color="danger" fill="outline" onClick={async () => {
                const result = await Dialog.confirm({
                  content: `确定删除"${editItem.name}"吗？`,
                  confirmText: '删除',
                  cancelText: '取消',
                })
                if (result) {
                  handleDelete(popupType, editItem.id!)
                  setPopupVisible(false)
                }
              }}>
                删除{popupType === 'color' ? '颜色' : '码数'}
              </Button>
            </div>
          )}
        </div>
      </Popup>
    </div>
  )
}
