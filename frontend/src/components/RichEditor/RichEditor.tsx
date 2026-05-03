import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useCallback, useEffect, useRef, useState } from 'react'
import './RichEditor.css'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichEditor({ content, onChange, placeholder = '开始编辑简历...' }: RichEditorProps) {
  const isSettingContent = useRef(false)
  const [showHeadingTools, setShowHeadingTools] = useState(false)
  const [showTableTools, setShowTableTools] = useState(false)
  const [isInTable, setIsInTable] = useState(false)
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isSettingContent.current) {
        onChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      isSettingContent.current = true
      editor.commands.setContent(content)
      isSettingContent.current = false
    }
  }, [content, editor])

  // Detect when cursor is in a table and position floating toolbar
  useEffect(() => {
    if (!editor) return

    const updateTableState = () => {
      const { $from } = editor.state.selection
      let inTable = false
      for (let i = $from.depth; i > 0; i--) {
        if ($from.node(i).type.name === 'table') {
          inTable = true
          break
        }
      }
      setIsInTable(inTable)

      if (inTable) {
        // Position floating toolbar above the table
        const container = editorContainerRef.current
        if (container) {
          const tableEl = container.querySelector('.tiptap table')
          if (tableEl) {
            const containerRect = container.getBoundingClientRect()
            const tableRect = tableEl.getBoundingClientRect()
            setFloatingPos({
              top: tableRect.top - containerRect.top - 36,
              left: tableRect.left - containerRect.left + (tableRect.width / 2) - 100,
            })
          }
        }
      } else {
        setFloatingPos(null)
      }
    }

    editor.on('selectionUpdate', updateTableState)
    editor.on('transaction', updateTableState)
    return () => {
      editor.off('selectionUpdate', updateTableState)
      editor.off('transaction', updateTableState)
    }
  }, [editor])

  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        editor?.chain().focus().setImage({ src: base64 }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('输入链接地址:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="rich-editor" ref={editorContainerRef}>
      <div className="rich-editor-toolbar">
        {/* History */}
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Headings toggle */}
        <div className="toolbar-group">
          <button
            onClick={() => setShowHeadingTools(!showHeadingTools)}
            className={showHeadingTools ? 'active' : ''}
            title="标题工具"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12h16M4 6h8M4 18h12" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Text formatting */}
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="加粗 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="斜体 (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="下划线 (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="删除线"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Lists */}
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="无序列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1" fill="currentColor" />
              <circle cx="4" cy="12" r="1" fill="currentColor" />
              <circle cx="4" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="有序列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
              <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
              <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Alignment */}
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
            title="左对齐"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
            title="居中"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="10" x2="6" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="18" y1="18" x2="6" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
            title="右对齐"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="7" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Block elements */}
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
            title="引用"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="分割线"
          >
            &mdash;
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'active' : ''}
            title="行内代码"
          >
            &lt;/&gt;
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'active' : ''}
            title="代码块"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Media */}
        <div className="toolbar-group">
          <button onClick={addLink} title="插入链接">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button onClick={addImage} title="插入图片">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Table toggle */}
        <div className="toolbar-group">
          <button
            onClick={() => setShowTableTools(!showTableTools)}
            className={showTableTools ? 'active' : ''}
            title="表格工具"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Heading tools - collapsible */}
      {showHeadingTools && (
        <div className="rich-editor-toolbar heading-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
              title="标题1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
              title="标题2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
              title="标题3"
            >
              H3
            </button>
          </div>
        </div>
      )}

      {/* Table tools - collapsible */}
      {showTableTools && (
        <div className="rich-editor-toolbar table-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()}
              title="插入表格"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>插入</span>
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              title="添加行"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>添加行</span>
            </button>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              title="添加列"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(90 12 12)">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>添加列</span>
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              title="删除行"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>删除行</span>
            </button>
            <button
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              title="删除列"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(90 12 12)">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>删除列</span>
            </button>
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              title="删除表格"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="5" y1="5" x2="19" y2="19" />
              </svg>
              <span>删除表格</span>
            </button>
          </div>
        </div>
      )}

      {/* Table floating toolbar */}
      {isInTable && floatingPos && (
        <div
          className="table-floating-toolbar"
          style={{
            position: 'absolute',
            top: floatingPos.top,
            left: Math.max(0, floatingPos.left),
            zIndex: 50,
          }}
        >
          <button onClick={() => editor.chain().focus().addRowAfter().run()} title="在下方添加行" style={{ width: 'auto', height: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>添加行</span>
          </button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} title="在右侧添加列" style={{ width: 'auto', height: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <line x1="12" y1="5" x2="12" y2="19" />
            </svg>
            <span>添加列</span>
          </button>
          <div className="toolbar-divider" />
          <button onClick={() => editor.chain().focus().deleteRow().run()} title="删除当前行" style={{ width: 'auto', height: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>删除行</span>
          </button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} title="删除当前列" style={{ width: 'auto', height: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>删除列</span>
          </button>
          <div className="toolbar-divider" />
          <button onClick={() => editor.chain().focus().deleteTable().run()} title="删除表格" className="delete-btn" style={{ width: 'auto', height: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="5" y1="5" x2="19" y2="19" />
            </svg>
            <span>删除</span>
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
