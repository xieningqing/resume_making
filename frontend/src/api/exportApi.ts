import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

async function capturePage(el: HTMLElement): Promise<HTMLCanvasElement> {
  // Temporarily expand parent overflow for full capture
  const scrollParents: { el: HTMLElement; overflow: string }[] = []
  let parent = el.parentElement
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    if (/(auto|scroll|hidden)/.test(style.overflow + style.overflowY + style.overflowX)) {
      scrollParents.push({ el: parent, overflow: parent.style.overflow })
      parent.style.overflow = 'visible'
    }
    parent = parent.parentElement
  }

  // Remove preview scale transform so export captures at full size
  const savedTransform = el.style.transform
  const savedOrigin = el.style.transformOrigin
  const wrapper = el.parentElement
  const savedWrapperW = wrapper?.style.width
  const savedWrapperH = wrapper?.style.height
  el.style.transform = ''
  el.style.transformOrigin = ''
  if (wrapper) {
    wrapper.style.width = ''
    wrapper.style.height = ''
  }

  try {
    return await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })
  } finally {
    el.style.transform = savedTransform
    el.style.transformOrigin = savedOrigin
    if (wrapper) {
      if (savedWrapperW) wrapper.style.width = savedWrapperW
      if (savedWrapperH) wrapper.style.height = savedWrapperH
    }
    for (const sp of scrollParents) {
      sp.el.style.overflow = sp.overflow
    }
  }
}

export const exportApi = {
  async exportPng(resumeId: number) {
    const pages = document.querySelectorAll('.preview-page-content') as NodeListOf<HTMLElement>
    if (pages.length === 0) throw new Error('未找到预览区域')

    // Capture all pages
    const canvases = await Promise.all(Array.from(pages).map(el => capturePage(el)))

    // Stitch vertically — each page as a card with border and shadow
    const BORDER = 12
    const SHADOW = 18
    const PAD = SHADOW + 8
    const PAGE_GAP = 48
    const cardW = canvases[0].width + (BORDER + SHADOW) * 2
    const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0)
      + canvases.length * (BORDER + SHADOW) * 2
      + (canvases.length - 1) * PAGE_GAP
    const merged = document.createElement('canvas')
    merged.width = cardW
    merged.height = totalHeight
    const ctx = merged.getContext('2d')!
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, cardW, totalHeight)

    let y = 0
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i]
      const x = BORDER + SHADOW
      // Shadow
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
      ctx.shadowBlur = SHADOW
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
      ctx.fillStyle = '#fff'
      ctx.fillRect(x, y + PAD, c.width, c.height)
      ctx.restore()
      // White border
      ctx.fillStyle = '#fff'
      ctx.fillRect(x, y + PAD, c.width, c.height)
      // Page content
      ctx.drawImage(c, x, y + PAD)
      y += c.height + (BORDER + SHADOW) * 2 + PAGE_GAP
    }

    const link = document.createElement('a')
    link.download = `resume-${resumeId}.png`
    link.href = merged.toDataURL('image/png')
    link.click()
  },

  async exportPdf(resumeId: number) {
    const pages = document.querySelectorAll('.preview-page-content') as NodeListOf<HTMLElement>
    if (pages.length === 0) throw new Error('未找到预览区域')

    const canvases = await Promise.all(Array.from(pages).map(el => capturePage(el)))

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = 210
    const pageH = 297

    canvases.forEach((canvas, i) => {
      if (i > 0) pdf.addPage()
      const imgData = canvas.toDataURL('image/png')
      const contentW = pageW
      const contentH = (canvas.height * contentW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, contentW, Math.min(contentH, pageH))
    })

    pdf.save(`resume-${resumeId}.pdf`)
  },
}
