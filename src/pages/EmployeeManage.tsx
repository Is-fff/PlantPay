import { useState, useEffect } from 'react'
import { List, Button, NavBar, Dialog, Popup, Form, Input, Toast } from 'antd-mobile'
import type { Employee } from '../db'
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from '../db'

export default function EmployeeManage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [popupVisible, setPopupVisible] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [name, setName] = useState('')
  const [remark, setRemark] = useState('')

  const load = async () => {
    setEmployees(await getAllEmployees())
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setName('')
    setRemark('')
    setPopupVisible(true)
  }

  const openEdit = (e: Employee) => {
    setEditing(e)
    setName(e.name)
    setRemark(e.remark)
    setPopupVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ icon: 'fail', content: '请输入姓名' })
      return
    }
    const data = { name: name.trim(), remark: remark.trim() }
    if (editing) {
      await updateEmployee(editing.id!, data)
      Toast.show({ icon: 'success', content: '修改成功' })
    } else {
      await addEmployee(data)
      Toast.show({ icon: 'success', content: '添加成功' })
    }
    setPopupVisible(false)
    await load()
  }

  const handleDelete = async (e: Employee) => {
    const result = await Dialog.confirm({
      content: `确定删除员工"${e.name}"吗？`,
      confirmText: '删除',
      cancelText: '取消',
    })
    if (result) {
      await deleteEmployee(e.id!)
      await load()
      Toast.show({ icon: 'success', content: '已删除' })
    }
  }

  return (
    <div className="page-body">
      <NavBar back={null}>员工管理</NavBar>

      {employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p>暂无员工，点击下方按钮添加</p>
        </div>
      ) : (
        <List style={{ marginTop: 8 }}>
          {employees.map((e) => (
            <List.Item
              key={e.id}
              description={e.remark || undefined}
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="small" color="primary" fill="outline" onClick={() => openEdit(e)}>编辑</Button>
                  <Button size="small" color="danger" fill="outline" onClick={() => handleDelete(e)}>删除</Button>
                </div>
              }
            >
              {e.name}
            </List.Item>
          ))}
        </List>
      )}

      <div style={{ padding: 16 }}>
        <Button block color="primary" size="large" onClick={openAdd}>新增员工</Button>
      </div>

      {/* Form Popup */}
      <Popup
        visible={popupVisible}
        onMaskClick={() => setPopupVisible(false)}
        position="bottom"
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div style={{ padding: 16 }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 16px' }}>
            {editing ? '编辑员工' : '新增员工'}
          </h3>
          <Form layout="horizontal">
            <Form.Item label="姓名">
              <Input
                placeholder="员工姓名"
                value={name}
                onChange={setName}
              />
            </Form.Item>
            <Form.Item label="备注">
              <Input
                placeholder="备注（选填）"
                value={remark}
                onChange={setRemark}
              />
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button block onClick={() => setPopupVisible(false)}>取消</Button>
            <Button block color="primary" onClick={handleSave}>
              {editing ? '保存修改' : '确定添加'}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
