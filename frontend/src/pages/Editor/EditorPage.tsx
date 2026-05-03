import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResumeStore } from '@/stores/resumeStore'
import { useUiStore } from '@/stores/uiStore'
import { useDebounce } from '@/hooks/useDebounce'
import { exportApi } from '@/api/exportApi'
import { resumeApi } from '@/api/resume'
import { Button } from '@/components/ui/Button'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { DraggableDivider } from '@/components/DraggableDivider/DraggableDivider'
import { BACKGROUND_TEMPLATES, getTemplateById } from '@/data/templates'
import { htmlToMarkdown, markdownToHtml } from '@/utils/converter'
import { usePagination } from '@/hooks/usePagination'

import './Editor.css'

const DEFAULT_CONTENT = `# 求职意向 - 前端开发工程师

(+86)138-0000-0000 ｜ zhangsan@email.com ｜ 微信号：zhangsan

## 教育背景

| **2024.09 - 2027.07** | **XX大学** \`985\` \`双一流\` | **计算机科学与技术 - 硕士** |
| --- | --- | --- |
| **2020.09 - 2024.07** | **XX大学** \`本科\` | **软件工程 - 学士** |

## 奖项证书

- **本科**：2021、2022、2023年一等奖学金
- **研究生**：2024年特等奖学金
- ACM-ICPC 亚洲区域赛银牌

## 实习经历

| XX科技有限公司 | 前端开发工程师 | **2025.06 - 2025.12** |
| --- | --- | --- |

- **项目描述**：负责公司核心产品的前端开发与维护，使用 React + TypeScript 构建高性能 Web 应用。
- **主要工作**：
  - 参与项目从需求分析到上线的**全周期**，与后端、设计团队紧密协作
  - 实现首屏加载速度优化，性能提升 **40%**
  - 封装通用业务组件，提升团队开发效率 **30%**
  - 推动前端工程化建设，引入 ESLint + Prettier 规范代码风格

## 项目经验

| **在线简历制作平台** | **2024.10 - 2025.01** | **项目负责人** |
| --- | --- | --- |

- **涉及技术：** React、TypeScript、Zustand、FastAPI、MySQL、Redis
- **项目介绍：** 基于 Markdown 的在线简历制作工具，支持实时预览、模板切换、PNG/PDF 导出。
- **核心功能：**
  - **实时预览**：基于 Markdown 解析实现双栏实时预览，支持多种背景模板切换
  - **导出功能**：集成 Playwright 实现后端渲染，保证导出 PNG/PDF 样式一致性
  - **用户系统**：JWT 鉴权 + 邮箱验证码注册，支持管理员后台管理
  - **性能优化**：使用防抖优化自动保存，减少不必要的 API 请求

## 专业技能

- 具备扎实的 **JavaScript/TypeScript** 基础，熟悉原型链、闭包、事件循环等核心概念
- 熟悉 **React** 生态，掌握 Hooks、状态管理（Zustand/Redux）、路由等
- 熟悉 **CSS3**、**Flex/Grid** 布局，能实现响应式设计和复杂动画效果
- 了解 **Node.js**、**Python**，能进行全栈开发
- 熟悉 **Git** 版本控制、**Docker** 容器化部署、**Linux** 基本操作
- 能利用 **Claude Code / Cursor** 等 AI 编程工具提升开发效率
`

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentResume, fetchResume, updateResume, clearCurrent } = useResumeStore()
  const addToast = useUiStore((s) => s.addToast)

  // HTML is the single source of truth
  const [htmlContent, setHtmlContent] = useState('')
  const [mdSource, setMdSource] = useState('') // only used in source-editing mode
  const [title, setTitle] = useState('')
  const [avatar, setAvatar] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState(1)
  const [isEditing, setIsEditing] = useState(false) // false=TipTap, true=source
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const debouncedHtml = useDebounce(htmlContent, 30000)

  // Content version key to force TipTap remount when switching modes
  const [contentVersion, setContentVersion] = useState(0)
  const skipNextSync = useRef(false)

  // Preview zoom
  const [previewScale, setPreviewScale] = useState(0.6)

  // Draggable divider state
  const [leftWidth, setLeftWidth] = useState(50)
  const editorBodyRef = useRef<HTMLDivElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const [horizontalMax, setHorizontalMax] = useState(0)
  const [horizontalValue, setHorizontalValue] = useState(0)

  // Block-based pagination - A4 at 96 DPI
  const PAGE_TOTAL_H = 1123
  const PAGE_TOTAL_W = 794
  const PAGE_PADDING_X = 64
  const PAGE_PADDING_TOP = 56
  const PAGE_PADDING_BOTTOM = 32
  const PAGE_CONTENT_H = PAGE_TOTAL_H - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM
  const AVATAR_H = 156 // avatar 120px + margin-bottom 16px + extra spacing
  const CONTENT_WIDTH = PAGE_TOTAL_W - PAGE_PADDING_X * 2

  const pageBlocks = usePagination(htmlContent, {
    contentWidth: CONTENT_WIDTH,
    firstPageHeight: PAGE_CONTENT_H - AVATAR_H,
    pageHeight: PAGE_CONTENT_H,
  })

  useEffect(() => {
    if (id) {
      fetchResume(Number(id))
    }
    return () => clearCurrent()
  }, [id, fetchResume, clearCurrent])

  // Load resume → convert markdown to HTML once
  useEffect(() => {
    if (currentResume) {
      if (skipNextSync.current) {
        skipNextSync.current = false
        return
      }

      const resumeContent = currentResume.content || DEFAULT_CONTENT
      setHtmlContent(markdownToHtml(resumeContent))
      setTitle(currentResume.title || '')
      setSelectedTemplate(currentResume.template_id || 1)
      setAvatar(currentResume.avatar || '')
    }
  }, [currentResume])

  // Save: convert HTML → markdown at save time
  const handleSave = useCallback(async (html?: string) => {
    if (!currentResume) return
    setSaving(true)
    try {
      const md = htmlToMarkdown(html ?? htmlContent)
      skipNextSync.current = true
      await updateResume(currentResume.id, {
        content: md,
        template_id: selectedTemplate,
      })
    } catch {
      skipNextSync.current = false
      addToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }, [currentResume, htmlContent, selectedTemplate, updateResume, addToast])

  // Auto-save on debounce
  useEffect(() => {
    if (!currentResume || !debouncedHtml) return
    const savedMd = currentResume.content || ''
    const currentMd = htmlToMarkdown(debouncedHtml)
    if (currentMd === savedMd) return
    handleSave(debouncedHtml)
  }, [debouncedHtml, currentResume, handleSave])

  // Ctrl+S save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Switch TipTap → source: generate markdown from current HTML
  const handleStartEditing = useCallback(() => {
    setMdSource(htmlToMarkdown(htmlContent))
    setIsEditing(true)
  }, [htmlContent])

  // Switch source → TipTap: convert markdown back to HTML
  const handleStopEditing = useCallback(() => {
    setHtmlContent(markdownToHtml(mdSource))
    setContentVersion(v => v + 1)
    setIsEditing(false)
  }, [mdSource])

  // TipTap content change → update HTML directly (single source of truth)
  const handleRichEditorChange = useCallback((html: string) => {
    setHtmlContent(html)
  }, [])

  const handleAvatarUpload = useCallback(() => {
    if (!currentResume) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > 2 * 1024 * 1024) {
        addToast('error', '图片大小不能超过 2MB')
        return
      }

      try {
        const res = await resumeApi.uploadAvatar(currentResume.id, file)
        setAvatar(res.data.avatar)
        addToast('success', '头像已更新')
      } catch {
        addToast('error', '头像上传失败')
      }
    }
    input.click()
  }, [currentResume, addToast])

  const handleRemoveAvatar = useCallback(async () => {
    if (!currentResume) return
    try {
      await resumeApi.deleteAvatar(currentResume.id)
      setAvatar('')
      addToast('success', '头像已移除')
    } catch {
      addToast('error', '移除头像失败')
    }
  }, [currentResume, addToast])

  const handleDividerResize = useCallback((width: number) => {
    setLeftWidth(width)
  }, [])

  useEffect(() => {
    const el = previewScrollRef.current
    if (!el) return

    const sync = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      setHorizontalMax(max)
      setHorizontalValue(el.scrollLeft)
    }

    const onScroll = () => setHorizontalValue(el.scrollLeft)
    sync()
    el.addEventListener('scroll', onScroll)
    window.addEventListener('resize', sync)

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', sync)
    }
  }, [leftWidth, pageBlocks.length])

  useEffect(() => {
    const el = previewScrollRef.current
    if (!el) return
    el.scrollLeft = 0
    setHorizontalValue(0)
  }, [leftWidth, pageBlocks.length])

  const handleHorizontalSlider = useCallback((value: number) => {
    const el = previewScrollRef.current
    if (!el) return
    el.scrollLeft = value
    setHorizontalValue(value)
  }, [])

  const handleExportPng = async () => {
    if (!currentResume) return
    setExporting(true)
    try {
      await exportApi.exportPng(currentResume.id)
      addToast('success', 'PNG 导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!currentResume) return
    setExporting(true)
    try {
      await exportApi.exportPdf(currentResume.id)
      addToast('success', 'PDF 导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const bgTemplate = getTemplateById(selectedTemplate)

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <button className="editor-back" onClick={() => navigate('/dashboard')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            className="editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => currentResume && updateResume(currentResume.id, { title })}
            placeholder="简历标题"
          />
        </div>
        <div className="editor-toolbar-right">
          <Button
            variant={saving ? 'secondary' : 'primary'}
            size="sm"
            loading={saving}
            onClick={() => handleSave()}
          >
            {saving ? '自动保存中...' : '保存'}
          </Button>
          <button
            className={`mode-btn ${isEditing ? 'active' : ''}`}
            onClick={isEditing ? handleStopEditing : handleStartEditing}
            title={isEditing ? '返回渲染视图' : '编辑源码'}
          >
            {isEditing ? '预览' : '源码'}
          </button>
          <div className="editor-template-select">
            {BACKGROUND_TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`editor-template-btn ${selectedTemplate === t.id ? 'active' : ''}`}
                style={{ background: t.preview || t.css.replace('background:', '').replace(';', '') }}
                onClick={() => setSelectedTemplate(t.id)}
                title={t.name}
              />
            ))}
          </div>
          <div className="editor-zoom-control">
            <span className="zoom-label">缩放</span>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={previewScale}
              onChange={(e) => setPreviewScale(Number(e.target.value))}
              className="zoom-slider"
            />
            <span className="zoom-value">{Math.round(previewScale * 100)}%</span>
          </div>
          <div className="editor-export-group">
            <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportPng}>
              导出 PNG
            </Button>
            <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportPdf}>
              导出 PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="editor-body" ref={editorBodyRef}>
        <div className="editor-pane" style={{ flex: `0 0 ${leftWidth}%`, width: `${leftWidth}%` }}>
          {isEditing ? (
            <textarea
              className="md-source-editor"
              value={mdSource}
              onChange={(e) => setMdSource(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <RichEditor
              key={contentVersion}
              content={htmlContent}
              onChange={handleRichEditorChange}
              placeholder="开始编辑简历..."
            />
          )}
        </div>
        <DraggableDivider onResize={handleDividerResize} initialLeftWidth={leftWidth} />
        <div className="editor-preview-pane" style={{ flex: `0 0 ${100 - leftWidth}%`, width: `${100 - leftWidth}%` }}>
          {/* Hidden measurement container — renders each block individually for height measurement */}
          {/* Real paginated pages — each page contains only its own blocks */}
          <div ref={previewScrollRef} className="editor-preview-scroll-area">
            {pageBlocks.map((pageBlockList, pageIndex) => (
            <div key={pageIndex} className="preview-page" style={{
              width: PAGE_TOTAL_W * previewScale,
              height: (PAGE_TOTAL_H + 20) * previewScale,
            }}>
              <div
                className="preview-page-content"
                style={{
                  background: bgTemplate.css.replace('background:', '').replace(/;.*$/, ''),
                  color: bgTemplate.css.includes('color:') ? bgTemplate.css.match(/color:\s*([^;]+)/)?.[1] : undefined,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {pageIndex === 0 && (
                  <div className="editor-preview-avatar" onClick={handleAvatarUpload}>
                    {avatar ? (
                      <div className="avatar-container">
                        <img src={avatar} alt="头像" className="avatar-image" />
                        <button className="avatar-remove" onClick={(e) => { e.stopPropagation(); handleRemoveAvatar() }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="avatar-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>点击上传头像</span>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className="editor-preview-content"
                  dangerouslySetInnerHTML={{ __html: pageBlockList.join('') }}
                />
              </div>
              <div className="preview-page-number">
                第 {pageIndex + 1} 页 / 共 {pageBlocks.length} 页
              </div>
            </div>
            ))}
          </div>
          {horizontalMax > 0 && (
            <div className="preview-horizontal-slider">
              <input
                type="range"
                min={0}
                max={horizontalMax}
                value={horizontalValue}
                onChange={(e) => handleHorizontalSlider(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
