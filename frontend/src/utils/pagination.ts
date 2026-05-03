/**
 * DOM-based pagination for resume preview pages.
 */

export interface PageData {
  blocks: string[]
}

export interface BlockWithHeight {
  html: string
  height: number
}

/**
 * Extract top-level block elements from an HTML string.
 */
export function extractBlocks(html: string): string[] {
  if (!html || !html.trim()) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const container = doc.body.firstElementChild as HTMLElement | null
  if (!container) return []

  const blocks: string[] = []
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        blocks.push(`<p>${node.textContent}</p>`)
      }
      continue
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.textContent?.trim() || el.querySelector('img, hr, br, table')) {
        blocks.push(el.outerHTML)
      }
    }
  }
  return blocks
}

function createMeasureBlock(html: string): HTMLDivElement {
  const block = document.createElement('div')
  block.className = 'preview-block'
  block.innerHTML = html
  return block
}

function createMeasureDiv(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:100%;'
  div.className = 'editor-preview-content'
  return div
}

function measureHtmlHeight(html: string, container: HTMLElement): number {
  const measureDiv = createMeasureDiv()
  const block = createMeasureBlock(html)
  measureDiv.appendChild(block)
  container.appendChild(measureDiv)

  const height = block.offsetHeight
  measureDiv.remove()
  return height
}

function cloneElementShell(el: HTMLElement): HTMLElement {
  const clone = document.createElement(el.tagName.toLowerCase())
  for (const attr of Array.from(el.attributes)) {
    clone.setAttribute(attr.name, attr.value)
  }
  return clone
}

function findTextSplitIndex(
  textNode: Text,
  container: HTMLElement,
  maxHeight: number,
): number {
  const text = textNode.textContent || ''
  if (text.length === 0) return -1

  const containerTop = container.getBoundingClientRect().top
  const range = document.createRange()

  range.selectNodeContents(textNode)
  const allRects = range.getClientRects()
  if (allRects.length === 0) return -1

  const lastRect = allRects[allRects.length - 1]
  if (lastRect.bottom - containerTop <= maxHeight) return -1

  let lo = 0
  let hi = text.length

  while (lo < hi) {
    const mid = (lo + hi) >> 1
    range.setStart(textNode, 0)
    range.setEnd(textNode, mid)
    const rects = range.getClientRects()
    if (rects.length === 0) {
      lo = mid + 1
      continue
    }

    const bottom = rects[rects.length - 1].bottom - containerTop
    if (bottom <= maxHeight) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  const splitAt = lo > 0 ? lo : text.length
  const spaceBefore = text.lastIndexOf(' ', splitAt - 1)
  if (spaceBefore > 0 && spaceBefore > splitAt - 20) {
    return spaceBefore + 1
  }
  return splitAt
}

/**
 * Split a block element at a page boundary.
 */
export function splitBlockAtHeight(
  blockHtml: string,
  container: HTMLElement,
  maxHeight: number,
): { fitting: string; overflow: string } | null {
  if (maxHeight <= 0) return { fitting: '', overflow: blockHtml }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${blockHtml}</div>`, 'text/html')
  const el = doc.body.firstElementChild as HTMLElement | null
  if (!el) return null

  if (measureHtmlHeight(blockHtml, container) <= maxHeight) return null

  const measureDiv = createMeasureDiv()
  const measureBlock = document.createElement('div')
  measureBlock.className = 'preview-block'
  const measureClone = el.cloneNode(true) as HTMLElement
  measureBlock.appendChild(measureClone)
  measureDiv.appendChild(measureBlock)
  container.appendChild(measureDiv)

  const childNodes = Array.from(measureClone.childNodes)
  if (childNodes.length > 1) {
    const partialDiv = createMeasureDiv()
    const partialBlock = document.createElement('div')
    partialBlock.className = 'preview-block'
    const partialEl = cloneElementShell(measureClone)
    partialBlock.appendChild(partialEl)
    partialDiv.appendChild(partialBlock)
    container.appendChild(partialDiv)

    let splitChildIndex = -1
    for (let i = 0; i < childNodes.length; i++) {
      partialEl.appendChild(childNodes[i].cloneNode(true))
      if (partialBlock.offsetHeight > maxHeight) {
        splitChildIndex = i
        partialEl.removeChild(partialEl.lastChild!)
        break
      }
    }

    partialDiv.remove()

    if (splitChildIndex > 0) {
      const fittingEl = cloneElementShell(measureClone)
      for (let i = 0; i < splitChildIndex; i++) {
        fittingEl.appendChild(childNodes[i].cloneNode(true))
      }

      const overflowEl = cloneElementShell(measureClone)
      for (let i = splitChildIndex; i < childNodes.length; i++) {
        overflowEl.appendChild(childNodes[i].cloneNode(true))
      }

      measureDiv.remove()
      return {
        fitting: fittingEl.outerHTML,
        overflow: overflowEl.outerHTML,
      }
    }
  }

  const textNodes: Text[] = []
  const walker = document.createTreeWalker(measureClone, NodeFilter.SHOW_TEXT)
  let tn: Text | null
  while ((tn = walker.nextNode() as Text | null)) {
    if (tn.textContent?.trim()) textNodes.push(tn)
  }

  let fittingText = ''
  let overflowText = ''

  for (const textNode of textNodes) {
    if (overflowText) {
      overflowText += textNode.textContent
      continue
    }

    const splitIdx = findTextSplitIndex(textNode, measureDiv, maxHeight)
    if (splitIdx === -1) {
      fittingText += textNode.textContent
    } else {
      fittingText += textNode.textContent!.slice(0, splitIdx)
      overflowText += textNode.textContent!.slice(splitIdx)
    }
  }

  measureDiv.remove()

  if (!fittingText && !overflowText) {
    return { fitting: '', overflow: blockHtml }
  }

  const tag = el.tagName.toLowerCase()
  const fittingHtml = fittingText ? `<${tag}>${fittingText}</${tag}>` : ''
  const overflowHtml = overflowText ? `<${tag}>${overflowText}</${tag}>` : ''

  return {
    fitting: fittingHtml,
    overflow: overflowHtml,
  }
}

/**
 * Pack measured blocks into pages. Oversized blocks are split instead of
 * being clipped by the fixed A4 page.
 */
export function packBlocksIntoPages(
  blocks: BlockWithHeight[],
  pageHeights: [number, number],
  container: HTMLElement,
): PageData[] {
  if (blocks.length === 0) return [{ blocks: [] }]

  const pages: PageData[] = []
  let currentBlocks: string[] = []
  let currentPageHeight = pageHeights[0]
  let remainingHeight = currentPageHeight
  let isFirstOnPage = true

  function flushPage() {
    if (currentBlocks.length > 0) {
      pages.push({ blocks: currentBlocks })
    }
    currentBlocks = []
    currentPageHeight = pageHeights[1]
    remainingHeight = currentPageHeight
    isFirstOnPage = true
  }

  for (const block of blocks) {
    let currentBlock = block.html
    let currentHeight = block.height

    while (currentBlock) {
      if (currentHeight <= remainingHeight) {
        currentBlocks.push(currentBlock)
        remainingHeight -= currentHeight
        isFirstOnPage = false
        break
      }

      const splitHeight = isFirstOnPage ? currentPageHeight : remainingHeight
      const result = splitBlockAtHeight(currentBlock, container, splitHeight)

      if (result?.fitting) {
        currentBlocks.push(result.fitting)
        flushPage()
        currentBlock = result.overflow
        currentHeight = measureHtmlHeight(currentBlock, container)
        continue
      }

      if (isFirstOnPage) {
        currentBlocks.push(currentBlock)
        remainingHeight = Math.max(0, remainingHeight - currentHeight)
        isFirstOnPage = false
        break
      }

      flushPage()
    }
  }

  if (currentBlocks.length > 0) {
    pages.push({ blocks: currentBlocks })
  }

  return pages.length > 0 ? pages : [{ blocks: [] }]
}
