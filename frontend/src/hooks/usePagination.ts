import { useLayoutEffect, useState } from 'react'

interface PaginationOptions {
  contentWidth: number
  firstPageHeight: number
  pageHeight: number
}

function createMeasureRoot(contentWidth: number): HTMLDivElement {
  const root = document.createElement('div')
  root.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    `width:${contentWidth}px`,
  ].join(';')
  document.body.appendChild(root)
  return root
}

function createPage(root: HTMLElement, height: number): HTMLDivElement {
  const page = document.createElement('div')
  page.className = 'editor-preview-content'
  page.style.cssText = [
    `width:${root.clientWidth}px`,
    `height:${height}px`,
    'overflow:hidden',
    'box-sizing:border-box',
  ].join(';')
  root.appendChild(page)
  return page
}

function pageOverflows(page: HTMLElement): boolean {
  return page.scrollHeight > page.clientHeight + 1
}

function cloneShell(el: HTMLElement): HTMLElement {
  const clone = document.createElement(el.tagName.toLowerCase())
  for (const attr of Array.from(el.attributes)) {
    clone.setAttribute(attr.name, attr.value)
  }
  return clone
}

function serializePage(page: HTMLElement): string[] {
  return Array.from(page.children).map((child) => (child as HTMLElement).outerHTML)
}

function appendAndCheck(page: HTMLElement, el: HTMLElement): boolean {
  page.appendChild(el)
  if (!pageOverflows(page)) return true
  page.removeChild(el)
  return false
}

function fitsInsideParent(page: HTMLElement, parent: HTMLElement, child: HTMLElement): boolean {
  const trialParent = parent.cloneNode(true) as HTMLElement
  trialParent.appendChild(child.cloneNode(true))
  page.appendChild(trialParent)
  const fits = !pageOverflows(page)
  page.removeChild(trialParent)
  return fits
}

function findReadableSplitIndex(text: string, best: number): number {
  if (best >= text.length) return best

  const breakChars = [' ', '\n', '\uFF0C', '\u3002', '\u3001', '\uFF1B', '\uFF1A', ',', '.', ';', ':']
  const nearbyBreak = Math.max(...breakChars.map((char) => text.lastIndexOf(char, best - 1)))

  if (nearbyBreak > 0 && best - nearbyBreak <= 24) {
    return nearbyBreak + 1
  }

  return best
}

function splitTextElement(
  source: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  const text = source.textContent || ''
  if (!text.trim()) {
    return { fitting: null, overflow: source.cloneNode(true) as HTMLElement }
  }

  let low = 0
  let high = text.length
  let best = 0

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const candidate = cloneShell(source)
    candidate.textContent = text.slice(0, mid)
    page.appendChild(candidate)
    const fits = !pageOverflows(page)
    page.removeChild(candidate)

    if (fits) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  best = findReadableSplitIndex(text, best)

  if (best <= 0) {
    return { fitting: null, overflow: source.cloneNode(true) as HTMLElement }
  }

  const fitting = cloneShell(source)
  fitting.textContent = text.slice(0, best).trimEnd()

  const overflow = cloneShell(source)
  overflow.textContent = text.slice(best).trimStart()

  return {
    fitting: fitting.textContent ? fitting : null,
    overflow: overflow.textContent ? overflow : null,
  }
}

function splitChildrenElement(
  source: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  const children = Array.from(source.children) as HTMLElement[]
  if (children.length === 0) return splitTextElement(source, page)

  const fitting = cloneShell(source)
  const overflow = cloneShell(source)
  let splitIndex = -1

  for (let i = 0; i < children.length; i++) {
    fitting.appendChild(children[i].cloneNode(true))
    page.appendChild(fitting)
    const fits = !pageOverflows(page)
    page.removeChild(fitting)

    if (!fits) {
      fitting.removeChild(fitting.lastChild!)
      splitIndex = i
      break
    }
  }

  if (splitIndex === -1) return { fitting: source.cloneNode(true) as HTMLElement, overflow: null }

  const splitChild = children[splitIndex]
  const nested = splitElementInsideParent(splitChild, fitting, page)
  if (nested.fitting) {
    fitting.appendChild(nested.fitting)
    if (nested.overflow) overflow.appendChild(nested.overflow)
    for (let i = splitIndex + 1; i < children.length; i++) {
      overflow.appendChild(children[i].cloneNode(true))
    }

    return {
      fitting,
      overflow: overflow.childNodes.length > 0 ? overflow : null,
    }
  }

  for (let i = splitIndex; i < children.length; i++) {
    overflow.appendChild(children[i].cloneNode(true))
  }

  if (fitting.children.length > 0) {
    return { fitting, overflow: overflow.childNodes.length > 0 ? overflow : null }
  }

  const firstChild = children[splitIndex]
  if (!firstChild) return { fitting: null, overflow }

  const firstChildSplit = splitElement(firstChild, page)
  if (firstChildSplit.fitting) fitting.appendChild(firstChildSplit.fitting)
  if (firstChildSplit.overflow) {
    overflow.innerHTML = ''
    overflow.appendChild(firstChildSplit.overflow)
    for (let i = splitIndex + 1; i < children.length; i++) {
      overflow.appendChild(children[i].cloneNode(true))
    }
  }

  return {
    fitting: fitting.childNodes.length > 0 ? fitting : null,
    overflow: overflow.childNodes.length > 0 ? overflow : null,
  }
}

function splitNestedChildrenInsideElement(
  source: HTMLElement,
  elementWithPrevious: HTMLElement,
  pageParentWithPrevious: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  const children = Array.from(source.children) as HTMLElement[]
  if (children.length === 0) return { fitting: null, overflow: source.cloneNode(true) as HTMLElement }

  const fitting = cloneShell(source)
  const overflow = cloneShell(source)
  let splitIndex = -1

  for (let i = 0; i < children.length; i++) {
    fitting.appendChild(children[i].cloneNode(true))

    const trialElement = elementWithPrevious.cloneNode(true) as HTMLElement
    trialElement.appendChild(fitting.cloneNode(true))

    if (!fitsInsideParent(page, pageParentWithPrevious, trialElement)) {
      fitting.removeChild(fitting.lastChild!)
      splitIndex = i
      break
    }
  }

  if (splitIndex === -1) return { fitting: source.cloneNode(true) as HTMLElement, overflow: null }

  for (let i = splitIndex; i < children.length; i++) {
    overflow.appendChild(children[i].cloneNode(true))
  }

  return {
    fitting: fitting.childNodes.length > 0 ? fitting : null,
    overflow: overflow.childNodes.length > 0 ? overflow : null,
  }
}

function splitElementInsideParent(
  source: HTMLElement,
  parentWithPrevious: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  if (source.matches('table')) return { fitting: null, overflow: source.cloneNode(true) as HTMLElement }

  const childNodes = Array.from(source.childNodes)
  if (childNodes.length === 0) return splitTextElement(source, page)

  const fitting = cloneShell(source)
  const overflow = cloneShell(source)
  let splitIndex = -1

  for (let i = 0; i < childNodes.length; i++) {
    fitting.appendChild(childNodes[i].cloneNode(true))
    if (!fitsInsideParent(page, parentWithPrevious, fitting)) {
      fitting.removeChild(fitting.lastChild!)
      splitIndex = i
      break
    }
  }

  if (splitIndex === -1) return { fitting: source.cloneNode(true) as HTMLElement, overflow: null }

  const splitNode = childNodes[splitIndex]
  if (
    splitNode?.nodeType === Node.ELEMENT_NODE &&
    (splitNode as HTMLElement).matches('ul, ol, blockquote')
  ) {
    const nested = splitNestedChildrenInsideElement(
      splitNode as HTMLElement,
      fitting,
      parentWithPrevious,
      page,
    )

    if (nested.fitting) fitting.appendChild(nested.fitting)
    if (nested.overflow) overflow.appendChild(nested.overflow)
    for (let i = splitIndex + 1; i < childNodes.length; i++) {
      overflow.appendChild(childNodes[i].cloneNode(true))
    }

    return {
      fitting: fitting.childNodes.length > 0 ? fitting : null,
      overflow: overflow.childNodes.length > 0 ? overflow : null,
    }
  }

  for (let i = splitIndex; i < childNodes.length; i++) {
    overflow.appendChild(childNodes[i].cloneNode(true))
  }

  return {
    fitting: fitting.childNodes.length > 0 ? fitting : null,
    overflow: overflow.childNodes.length > 0 ? overflow : null,
  }
}

function splitTable(
  source: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  const rows = Array.from(source.querySelectorAll('tr')) as HTMLTableRowElement[]
  if (rows.length <= 1) return { fitting: null, overflow: source.cloneNode(true) as HTMLElement }

  const fitting = cloneShell(source) as HTMLTableElement
  const overflow = cloneShell(source) as HTMLTableElement
  const fittingBody = document.createElement('tbody')
  const overflowBody = document.createElement('tbody')
  fitting.appendChild(fittingBody)
  overflow.appendChild(overflowBody)

  let splitIndex = -1
  for (let i = 0; i < rows.length; i++) {
    fittingBody.appendChild(rows[i].cloneNode(true))
    page.appendChild(fitting)
    const fits = !pageOverflows(page)
    page.removeChild(fitting)

    if (!fits) {
      fittingBody.removeChild(fittingBody.lastChild!)
      splitIndex = i
      break
    }
  }

  if (splitIndex === -1) return { fitting: source.cloneNode(true) as HTMLElement, overflow: null }
  for (let i = splitIndex; i < rows.length; i++) {
    overflowBody.appendChild(rows[i].cloneNode(true))
  }

  return {
    fitting: fittingBody.children.length > 0 ? fitting : null,
    overflow: overflowBody.children.length > 0 ? overflow : null,
  }
}

function splitElement(
  source: HTMLElement,
  page: HTMLElement,
): { fitting: HTMLElement | null; overflow: HTMLElement | null } {
  if (source.matches('table')) return splitTable(source, page)
  if (source.matches('ul, ol, blockquote')) return splitChildrenElement(source, page)
  return splitTextElement(source, page)
}

function normalizeHtmlBlocks(html: string): HTMLElement[] {
  const template = document.createElement('template')
  template.innerHTML = html

  return Array.from(template.content.childNodes).flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (!text) return []
      const p = document.createElement('p')
      p.textContent = text
      return [p]
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return []
    const el = node as HTMLElement
    if (!el.textContent?.trim() && !el.querySelector('img, hr, br, table')) return []
    return [el]
  })
}

export function usePagination(html: string, options: PaginationOptions) {
  const [pages, setPages] = useState<string[][]>([[]])

  useLayoutEffect(() => {
    if (!html.trim()) {
      setPages([[]])
      return
    }

    const root = createMeasureRoot(options.contentWidth)
    let currentPage = createPage(root, options.firstPageHeight)
    const sourceBlocks = normalizeHtmlBlocks(html)

    const flushPage = () => {
      currentPage = createPage(root, options.pageHeight)
    }

    try {
      for (const sourceBlock of sourceBlocks) {
        let block: HTMLElement | null = sourceBlock.cloneNode(true) as HTMLElement

        while (block) {
          if (block.classList.contains('page-break')) {
            flushPage()
            break
          }

          if (appendAndCheck(currentPage, block.cloneNode(true) as HTMLElement)) {
            block = null
            break
          }

          const currentHasContent = currentPage.children.length > 0
          const split = splitElement(block, currentPage)

          if (split.fitting && appendAndCheck(currentPage, split.fitting)) {
            flushPage()
            block = split.overflow
            continue
          }

          if (currentHasContent) {
            flushPage()
            continue
          }

          currentPage.appendChild(block.cloneNode(true))
          block = null
        }
      }

      const nextPages = Array.from(root.children)
        .map((page) => serializePage(page as HTMLElement))
        .filter((page) => page.length > 0)

      setPages(nextPages.length > 0 ? nextPages : [[]])
    } finally {
      root.remove()
    }
  }, [html, options.contentWidth, options.firstPageHeight, options.pageHeight])

  return pages
}
