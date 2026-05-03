import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/uiStore'
import type { User } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import './Admin.css'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const addToast = useUiStore((s) => s.addToast)

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers(p, 20, s)
      setUsers(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('error', '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1)
    fetchUsers(1, search)
  }

  const handleToggleActive = async (user: User) => {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      addToast('success', `用户已${user.is_active ? '禁用' : '启用'}`)
    } catch {
      addToast('error', '操作失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      await adminApi.deleteUser(deleteUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
      addToast('success', '用户已删除')
    } catch {
      addToast('error', '删除失败')
    }
    setDeleteUser(null)
  }

  const handleToggleAdmin = async (user: User) => {
    try {
      await adminApi.updateUser(user.id, { is_admin: !user.is_admin })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
      addToast('success', `已${user.is_admin ? '取消' : '设置'}管理员权限`)
    } catch {
      addToast('error', '操作失败')
    }
  }

  const handleResetPassword = async () => {
    if (!resetUser) return
    try {
      await adminApi.resetPassword(resetUser.id)
      addToast('success', `密码已重置为: ${resetUser.email}`)
    } catch {
      addToast('error', '重置失败')
    }
    setResetUser(null)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">用户管理</h1>

      <Card>
        <div className="admin-toolbar">
          <div className="admin-search">
            <Input
              placeholder="搜索邮箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="secondary" size="sm" onClick={handleSearch}>搜索</Button>
          </div>
          <span className="admin-total">共 {total} 个用户</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>角色</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="admin-table-empty">加载中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="admin-table-empty">暂无数据</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`admin-badge ${user.is_active ? 'admin-badge-success' : 'admin-badge-error'}`}>
                        {user.is_active ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${user.is_admin ? 'admin-badge-info' : 'admin-badge-default'}`}>
                        {user.is_admin ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td className="admin-table-time">{new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
                    <td>
                      <div className="admin-actions">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                          {user.is_active ? '禁用' : '启用'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleAdmin(user)}>
                          {user.is_admin ? '取消管理员' : '设为管理员'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setResetUser(user)}>
                          重置密码
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteUser(user)}>
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="admin-page-info">{page} / {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        )}
      </Card>

      <Modal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="确认删除"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteUser(null)}>取消</Button>
            <Button variant="danger" onClick={handleDelete}>删除</Button>
          </>
        }
      >
        <p>确定要删除用户 <strong>{deleteUser?.email}</strong> 吗？该操作将同时删除其所有简历。</p>
      </Modal>

      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title="确认重置密码"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetUser(null)}>取消</Button>
            <Button variant="primary" onClick={handleResetPassword}>确认重置</Button>
          </>
        }
      >
        <p>确定要将用户 <strong>{resetUser?.email}</strong> 的密码重置为其邮箱地址吗？</p>
      </Modal>
    </div>
  )
}
