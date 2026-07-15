import { describe, expect, it } from 'vitest'
import { getFileExtension, isTextFile, TEXT_EXTS } from '../useFileManagerOps'

describe('useFileManagerOps text helpers', () => {
  it('includes py/sh/desktop extensions', () => {
    expect(TEXT_EXTS).toEqual(expect.arrayContaining(['py', 'sh', 'desktop']))
  })

  it('getFileExtension returns lowercase extension', () => {
    expect(getFileExtension('Foo.PY')).toBe('py')
    expect(getFileExtension('archive.tar.gz')).toBe('gz')
  })

  it('isTextFile recognizes restored extensions', () => {
    expect(isTextFile('script.py')).toBe(true)
    expect(isTextFile('run.sh')).toBe(true)
    expect(isTextFile('app.desktop')).toBe(true)
    expect(isTextFile('photo.png')).toBe(false)
  })
})
