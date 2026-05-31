import { List, NavBar, Dialog, Toast } from 'antd-mobile'
import { exportAllData, importAllData, clearAllData } from '../db'

export default function Settings() {
  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    a.download = `factory-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    Toast.show({ icon: 'success', content: '导出成功' })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!data.employees || !data.products || !data.colors || !data.sizes || !data.records) {
          Toast.show({ icon: 'fail', content: '文件格式不正确' })
          return
        }
        const result = await Dialog.confirm({
          content: '导入数据将覆盖当前所有数据，确定继续吗？',
          confirmText: '确定导入',
          cancelText: '取消',
        })
        if (!result) return
        await importAllData(data)
        Toast.show({ icon: 'success', content: '导入成功' })
      } catch {
        Toast.show({ icon: 'fail', content: '文件解析失败' })
      }
    }
    input.click()
  }

  const handleClear = async () => {
    const result = await Dialog.confirm({
      content: '清空所有数据？此操作不可恢复！',
      confirmText: '确认清空',
      cancelText: '取消',
    })
    if (!result) return

    const password = prompt('请输入确认密码（123456）：')
    if (password !== '123456') {
      Toast.show({ icon: 'fail', content: '密码错误' })
      return
    }
    await clearAllData()
    Toast.show({ icon: 'success', content: '数据已清空' })
  }

  return (
    <div className="page-body">
      <NavBar back={null}>设置</NavBar>

      <List style={{ marginTop: 8 }}>
        <List.Item
          prefix={<span style={{ fontSize: 22 }}>📤</span>}
          onClick={handleExport}
          description="将所有数据备份为 JSON 文件"
        >
          导出数据
        </List.Item>
        <List.Item
          prefix={<span style={{ fontSize: 22 }}>📥</span>}
          onClick={handleImport}
          description="从备份文件恢复数据（会覆盖现有数据）"
        >
          导入数据
        </List.Item>
        <List.Item
          prefix={<span style={{ fontSize: 22 }}>🗑</span>}
          onClick={handleClear}
          description="删除所有员工、型号、记录等数据"
        >
          <span style={{ color: '#ff4d4f' }}>清空数据</span>
        </List.Item>
      </List>

      <div style={{ textAlign: 'center', marginTop: 40, color: '#ccc', fontSize: 12 }}>
        工厂工资结算系统 v1.0
      </div>
    </div>
  )
}
