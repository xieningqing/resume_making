export interface BackgroundTemplate {
  id: number
  name: string
  css: string
  preview?: string
}

export const BACKGROUND_TEMPLATES: BackgroundTemplate[] = [
  {
    id: 1,
    name: '经典白',
    css: 'background: #ffffff;',
    preview: '#ffffff',
  },
  {
    id: 2,
    name: '浅灰',
    css: 'background: #f8f9fa;',
    preview: '#f8f9fa',
  },
  {
    id: 3,
    name: '暖白',
    css: 'background: #fefcf3;',
    preview: '#fefcf3',
  },
  {
    id: 4,
    name: '浅蓝',
    css: 'background: #f0f4ff;',
    preview: '#f0f4ff',
  },
  {
    id: 5,
    name: '浅紫',
    css: 'background: #f5f0ff;',
    preview: '#f5f0ff',
  },
  {
    id: 6,
    name: '浅绿',
    css: 'background: #f0fff4;',
    preview: '#f0fff4',
  },
  {
    id: 7,
    name: '渐变蓝紫',
    css: 'background: linear-gradient(135deg, #f0f0ff 0%, #faf5ff 100%);',
    preview: 'linear-gradient(135deg, #f0f0ff 0%, #faf5ff 100%)',
  },
  {
    id: 8,
    name: '渐变暖阳',
    css: 'background: linear-gradient(135deg, #fff5f0 0%, #fffbf0 100%);',
    preview: 'linear-gradient(135deg, #fff5f0 0%, #fffbf0 100%)',
  },
  {
    id: 9,
    name: '渐变清新',
    css: 'background: linear-gradient(135deg, #f0fff4 0%, #f0f4ff 100%);',
    preview: 'linear-gradient(135deg, #f0fff4 0%, #f0f4ff 100%)',
  },
  {
    id: 10,
    name: '米色',
    css: 'background: #faf8f5;',
    preview: '#faf8f5',
  },
  {
    id: 11,
    name: '淡粉',
    css: 'background: #fff5f7;',
    preview: '#fff5f7',
  },
  {
    id: 12,
    name: '深色',
    css: 'background: #1a1a2e; color: #eee;',
    preview: '#1a1a2e',
  },
]

export function getTemplateById(id: number): BackgroundTemplate {
  return BACKGROUND_TEMPLATES.find((t) => t.id === id) || BACKGROUND_TEMPLATES[0]
}
