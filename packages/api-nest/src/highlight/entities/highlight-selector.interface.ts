/**
 * Highlight selector types for robust text positioning
 */
export type HighlightSelectorType = 'range' | 'xpath' | 'css' | 'text-quote'

/**
 * Base interface for all highlight selectors
 */
export interface HighlightSelector {
  /** Type of selector (range, xpath, css, text-quote) */
  type: HighlightSelectorType
  /** Selector value/expression */
  value: string
  /** Optional start position (for range/text-position selectors) */
  start?: number
  /** Optional end position (for range/text-position selectors) */
  end?: number
  /** Additional type-specific fields */
  [key: string]: any
}
