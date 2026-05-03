import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResumeStore } from '@/stores/resumeStore'
import { useUiStore } from '@/stores/uiStore'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import './Dashboard.css'

export function DashboardPage() {
  const { resumes, isLoading, fetchResumes, createResume, deleteResume } = useResumeStore()
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [showAnnouncement, setShowAnnouncement] = useState(true)

  useEffect(() => {
    fetchResumes()
    authApi.getAnnouncement().then((res) => {
      if (res.data.content) {
        setAnnouncement(res.data.content)
      }
    }).catch(() => {})
  }, [fetchResumes])

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      addToast('error', '请输入简历标题')
      return
    }
    setCreating(true)
    try {
      const requestedTitle = newTitle.trim()
      const resume = await createResume(requestedTitle)
      setShowCreateModal(false)
      setNewTitle('')
      if (resume.title !== requestedTitle) {
        addToast('success', `已自动创建副本「${resume.title}」`)
      } else {
        addToast('success', '简历创建成功')
      }
      navigate(`/editor/${resume.id}`)
    } catch {
      addToast('error', '创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteResume(deleteId)
      addToast('success', '简历已删除')
    } catch {
      addToast('error', '删除失败')
    }
    setDeleteId(null)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">我的简历</h1>
          <p className="dashboard-desc">管理你的所有简历，点击卡片进入编辑</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <span>+</span> 新建简历
        </Button>
      </div>

      {announcement && showAnnouncement && (
        <div className="dashboard-announcement">
          <div className="dashboard-announcement-content">
            <span className="dashboard-announcement-icon">📢</span>
            <span>{announcement}</span>
          </div>
          <button className="dashboard-announcement-close" onClick={() => setShowAnnouncement(false)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="dashboard-loading">加载中...</div>
      ) : resumes.length === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">📄</div>
          <h3>还没有简历</h3>
          <p>创建你的第一份简历，开始你的求职之旅</p>
          <Button onClick={() => setShowCreateModal(true)}>创建简历</Button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {resumes.map((resume) => (
            <Card key={resume.id} hoverable className="dashboard-card" onClick={() => navigate(`/editor/${resume.id}`)}>
              <div className="dashboard-card-preview">
                <div className="dashboard-card-preview-text">
                  {resume.content?.slice(0, 100) || '空白简历'}
                </div>
              </div>
              <div className="dashboard-card-info">
                <h3 className="dashboard-card-title">{resume.title}</h3>
                <span className="dashboard-card-date">{formatDate(resume.updated_at)}</span>
              </div>
              <button
                className="dashboard-card-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteId(resume.id)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建简历"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
            <Button loading={creating} onClick={handleCreate}>创建</Button>
          </>
        }
      >
        <Input
          label="简历标题"
          placeholder="例如：前端工程师简历"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          autoFocus
        />
      </Modal>

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
