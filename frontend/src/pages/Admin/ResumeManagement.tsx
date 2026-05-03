import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/uiStore'
import type { Resume } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import './Admin.css'

export function ResumeManagement() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const addToast = useUiStore((s) => s.addToast)

  const fetchResumes = async (p = page) => {
    setLoading(true)
    try {
      const res = await adminApi.getResumes(p, 20)
      setResumes(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('error', '加载简历列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await adminApi.deleteResume(deleteId)
      setResumes((prev) => prev.filter((r) => r.id !== deleteId))
      addToast('success', '简历已删除')
    } catch {
      addToast('error', '删除失败')
    }
    setDeleteId(null)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">简历管理</h1>

      <Card>
        <div className="admin-toolbar">
          <span className="admin-total">共 {total} 份简历</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>用户ID</th>
                <th>创建时间</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="admin-table-empty">加载中...</td></tr>
              ) : resumes.length === 0 ? (
                <tr><td colSpan={6} className="admin-table-empty">暂无数据</td></tr>
              ) : (
                resumes.map((resume) => (
                  <tr key={resume.id}>
                    <td>{resume.id}</td>
                    <td>{resume.title}</td>
                    <td>{resume.user_id}</td>
                    <td className="admin-table-time">{new Date(resume.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="admin-table-time">{new Date(resume.updated_at).toLocaleDateString('zh-CN')}</td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(resume.id)}>删除</Button>
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
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="确认删除"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="danger" onClick={handleDelete}>删除</Button>
          </>
        }
      >
        <p>确定要删除这份简历吗？此操作不可撤销。</p>
      </Modal>
    </div>
  )
}
