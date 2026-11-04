import { describe, expect, it } from 'vitest'
import { CATEGORIES, categoryChipClass, categoryHex, categoryTextClass } from '../utils/categories'

describe('development category colours', () => {
  it('gives every category its own colour in text, chip and hex form', () => {
    expect(CATEGORIES).toEqual(['Academic', 'Social', 'Wellbeing', 'Creative', 'Physical'])
    expect(new Set(CATEGORIES.map(categoryHex)).size).toBe(CATEGORIES.length)
    expect(categoryTextClass('Academic')).toBe('text-blue-600')
    expect(categoryChipClass('Social')).toBe('bg-cyan-100 text-cyan-700')
    expect(categoryHex('Wellbeing')).toBe('#86EFAC')
  })

  it('falls back to grey for an unknown category', () => {
    expect(categoryTextClass('Other')).toBe('text-gray-500')
    expect(categoryChipClass('Other')).toBe('bg-gray-200 text-gray-600')
    expect(categoryHex('Other')).toBe('#94A3B8')
  })
})
