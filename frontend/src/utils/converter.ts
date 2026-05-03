import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { marked } from 'marked'

// Configure marked for GFM (tables, strikethrough, etc.)
marked.setOptions({
  gfm: true,
  breaks: false,
})

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
})

// Enable GFM table support
turndownService.use(gfm)

// Remove images (avatars)
turndownService.addRule('removeImages', {
  filter: 'img',
  replacement: () => '',
})

// Keep line breaks
turndownService.addRule('lineBreak', {
  filter: 'br',
  replacement: () => '\n',
})

export function htmlToMarkdown(html: string): string {
  // Clean up HTML before conversion
  let cleanHtml = html

  // Remove TipTap wrapper divs
  cleanHtml = cleanHtml.replace(/<div[^>]*class="[^"]*tiptap[^"]*"[^>]*>/gi, '')
  cleanHtml = cleanHtml.replace(/<\/div>\s*$/gi, '')

  // Convert <p> tags to preserve line breaks
  cleanHtml = cleanHtml.replace(/<p><\/p>/gi, '\n')

  // Clean up table HTML - remove TipTap specific attributes
  cleanHtml = cleanHtml.replace(/<table[^>]*>/gi, '<table>')
  cleanHtml = cleanHtml.replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, '')
  cleanHtml = cleanHtml.replace(/<col[^>]*>/gi, '')
  cleanHtml = cleanHtml.replace(/\s*style="[^"]*"/gi, '')
  cleanHtml = cleanHtml.replace(/\s*colspan="[^"]*"/gi, '')
  cleanHtml = cleanHtml.replace(/\s*rowspan="[^"]*"/gi, '')

  // Remove empty paragraphs inside table cells
  cleanHtml = cleanHtml.replace(/<td>\s*<p>(.*?)<\/p>\s*<\/td>/gi, '<td>$1</td>')
  cleanHtml = cleanHtml.replace(/<th>\s*<p>(.*?)<\/p>\s*<\/th>/gi, '<th>$1</th>')

  let md = turndownService.turndown(cleanHtml)

  // Clean up excessive escaping
  md = md.replace(/\\([*_`])/g, '$1') // Remove unnecessary escapes
  md = md.replace(/\\{2,}/g, '\\')    // Reduce multiple backslashes
  md = md.replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines

  return md.trim()
}

export function isRichTextCompatible(content: string): boolean {
  // Check if content uses features not supported in rich text mode
  const unsupportedPatterns = [
    /^:::\s*(start|end)/m,  // Container syntax
    /\{[^}]+\}/,            // Custom attributes
    /!\[.*?\]\(data:/,      // Base64 images (avatars)
  ]

  return !unsupportedPatterns.some(pattern => pattern.test(content))
}

export function markdownToHtml(md: string): string {
  return marked.parse(md) as string
}
