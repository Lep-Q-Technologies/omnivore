/**
 * Content Processor Utilities Unit Tests
 */

import {
  calculateWordCount,
  convertPdfTextToHtml,
  escapeHtml,
  generateContentHash,
} from './content-processor.utils'

describe('Content Processor Utilities', () => {
  describe('calculateWordCount', () => {
    describe('basic functionality', () => {
      it('should count words in simple HTML content', () => {
        const html = '<div><p>Hello world, this is a test.</p></div>'
        expect(calculateWordCount(html)).toBe(6)
      })

      it('should handle empty content', () => {
        expect(calculateWordCount('')).toBe(0)
        expect(calculateWordCount('   ')).toBe(0)
      })

      it('should handle HTML with no text content', () => {
        const html = '<div></div>'
        expect(calculateWordCount(html)).toBe(0)
      })

      it('should count words in plain text', () => {
        const text = 'This is plain text without HTML tags'
        expect(calculateWordCount(text)).toBe(7)
      })
    })

    describe('HTML parsing', () => {
      it('should strip HTML tags from content', () => {
        const html =
          '<div><h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p></div>'
        expect(calculateWordCount(html)).toBe(4) // Title Paragraph bold text
      })

      it('should handle nested HTML elements', () => {
        const html = `
          <div class="article">
            <header><h1>Article Title</h1></header>
            <section>
              <p>First paragraph with <em>emphasis</em>.</p>
              <p>Second paragraph with <a href="#">link</a>.</p>
            </section>
          </div>
        `
        expect(calculateWordCount(html)).toBe(10)
      })

      it('should handle Readability-style HTML fragments', () => {
        const html = `
          <DIV class="page" id="readability-page-1">
            <div>
              <p>This is content from Readability parser.</p>
              <p>It comes wrapped in a DIV element.</p>
            </div>
          </DIV>
        `
        expect(calculateWordCount(html)).toBe(13)
      })

      it('should handle HTML with inline styles and attributes', () => {
        const html =
          '<div style="color: red;" data-id="123"><p class="text">Content here</p></div>'
        expect(calculateWordCount(html)).toBe(2)
      })
    })

    describe('HTML entity decoding', () => {
      it('should decode common HTML entities', () => {
        const html = '<p>Tom&nbsp;&amp;&nbsp;Jerry</p>'
        expect(calculateWordCount(html)).toBe(3)
      })

      it('should decode numeric entities', () => {
        const html = '<p>Hello&#32;world</p>'
        expect(calculateWordCount(html)).toBe(2)
      })

      it('should handle special characters', () => {
        const html = '<p>Price: $100 &mdash; sold!</p>'
        expect(calculateWordCount(html)).toBe(4)
      })

      it('should handle quotes and apostrophes', () => {
        const html = "<p>&quot;It's&quot; a test</p>"
        expect(calculateWordCount(html)).toBe(3)
      })
    })

    describe('whitespace normalization', () => {
      it('should normalize multiple spaces', () => {
        const html = '<p>Hello     world    test</p>'
        expect(calculateWordCount(html)).toBe(3)
      })

      it('should handle line breaks', () => {
        const html = `<p>First line
        Second line
        Third line</p>`
        expect(calculateWordCount(html)).toBe(6)
      })

      it('should trim leading and trailing whitespace', () => {
        const html = '   <p>   Content   </p>   '
        expect(calculateWordCount(html)).toBe(1)
      })

      it('should handle mixed whitespace characters', () => {
        const html = '<p>Word1\t\tWord2\n\nWord3</p>'
        expect(calculateWordCount(html)).toBe(3)
      })
    })

    describe('edge cases', () => {
      it('should handle very long content', () => {
        const words = Array(10000).fill('word').join(' ')
        const html = `<div><p>${words}</p></div>`
        expect(calculateWordCount(html)).toBe(10000)
      })

      it('should handle content with only punctuation', () => {
        const html = '<p>... !!! ???</p>'
        expect(calculateWordCount(html)).toBe(3)
      })

      it('should handle mixed language content', () => {
        const html = '<p>Hello world 你好世界 Hola mundo</p>'
        expect(calculateWordCount(html)).toBeGreaterThan(0)
      })

      it('should handle content with URLs', () => {
        const html = '<p>Visit https://example.com for more info</p>'
        expect(calculateWordCount(html)).toBe(5)
      })

      it('should handle malformed HTML gracefully', () => {
        const html = '<p>Unclosed paragraph<div>Nested content'
        expect(calculateWordCount(html)).toBe(3)
      })
    })

    describe('real-world examples', () => {
      it('should accurately count words in article-like content', () => {
        const html = `
          <div class="article">
            <h1>The Future of Web Development</h1>
            <p>Web development has evolved significantly over the past decade.</p>
            <p>Modern frameworks like React and Vue have revolutionized how we build applications.</p>
            <p>The future looks bright with emerging technologies like WebAssembly and serverless computing.</p>
          </div>
        `
        expect(calculateWordCount(html)).toBe(38)
      })

      it('should match word count from known article', () => {
        const html = `
          <DIV class="page" id="readability-page-1">
            <div>
              <p>To provide genuinely helpful signals for product decisions, a backlog needs to be well-organized.</p>
              <p>But organizing a backlog has historically been manual work that doesn't scale.</p>
            </div>
          </DIV>
        `
        expect(calculateWordCount(html)).toBe(26)
      })
    })

    describe('error handling', () => {
      it('should return 0 for null input', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(calculateWordCount(null as unknown as string)).toBe(0)
      })

      it('should return 0 for undefined input', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(calculateWordCount(undefined as unknown as string)).toBe(0)
      })

      it('should handle invalid HTML gracefully', () => {
        const html = '<<>><>invalid html<<>>'
        expect(calculateWordCount(html)).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('generateContentHash', () => {
    it('should generate SHA-256 hash', () => {
      const content = 'test content'
      const hash = generateContentHash(content)
      expect(hash).toBeTruthy()
      expect(hash.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should generate same hash for same content', () => {
      const content = 'test content'
      const hash1 = generateContentHash(content)
      const hash2 = generateContentHash(content)
      expect(hash1).toBe(hash2)
    })

    it('should generate different hash for different content', () => {
      const hash1 = generateContentHash('content 1')
      const hash2 = generateContentHash('content 2')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty content', () => {
      expect(generateContentHash('')).toBe('')
    })
  })

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    it('should escape less than', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b')
    })

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("it's fine")).toBe('it&#039;s fine')
    })

    it('should escape all special chars together', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should handle string with no special chars', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('convertPdfTextToHtml', () => {
    it('should wrap text in HTML structure', () => {
      const text = 'Hello world'
      const html = convertPdfTextToHtml(text)
      expect(html).toContain('<div class="pdf-content">')
      expect(html).toContain('<p>Hello world</p>')
      expect(html).toContain('</div>')
    })

    it('should split paragraphs on double newlines', () => {
      const text = 'First paragraph\n\nSecond paragraph'
      const html = convertPdfTextToHtml(text)
      expect(html).toContain('<p>First paragraph</p>')
      expect(html).toContain('<p>Second paragraph</p>')
    })

    it('should convert single newlines to br tags', () => {
      const text = 'Line one\nLine two'
      const html = convertPdfTextToHtml(text)
      expect(html).toContain('<p>Line one<br>Line two</p>')
    })

    it('should include page count metadata when provided', () => {
      const text = 'Content'
      const html = convertPdfTextToHtml(text, 5)
      expect(html).toContain('<div class="pdf-metadata">Pages: 5</div>')
    })

    it('should handle empty text', () => {
      expect(convertPdfTextToHtml('')).toBe('')
    })

    it('should filter empty paragraphs', () => {
      const text = 'Content\n\n\n\nMore content'
      const html = convertPdfTextToHtml(text)
      const paragraphCount = (html.match(/<p>/g) || []).length
      expect(paragraphCount).toBe(2)
    })
  })
})
