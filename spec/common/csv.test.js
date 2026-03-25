import {
  encode,
  decode,
  join,
  parse
} from '#tropy/common/csv.js'

describe('csv', () => {

  describe('encode', () => {
    it('wraps a value in double quotes', () => {
      expect(encode('hello')).to.equal('"hello"')
    })

    it('escapes double quotes by doubling them', () => {
      expect(encode('say "hi"')).to.equal('"say ""hi"""')
    })

    it('converts non-string values to strings', () => {
      expect(encode(42)).to.equal('"42"')
    })
  })

  describe('decode', () => {
    it('strips surrounding double quotes', () => {
      expect(decode('"hello"')).to.equal('hello')
    })

    it('unescapes doubled double quotes', () => {
      expect(decode('"say ""hi"""')).to.equal('say "hi"')
    })
  })

  describe('join', () => {
    it('joins values as comma-separated by default', () => {
      expect(join(['a', 'b', 'c'])).to.equal('"a","b","c"')
    })

    it('accepts a custom separator', () => {
      expect(join(['a', 'b'], ';')).to.equal('"a";"b"')
    })
  })

  describe('joinAsRows', () => {
    it('joins values as newline-separated rows', () => {
      expect(join(['a', 'b', 'c'], '\n')).to.equal('"a"\n"b"\n"c"')
    })
  })

  describe('parse', () => {
    it('splits comma-separated values by default', () => {
      expect(parse('"a","b","c"')).to.eql(['a', 'b', 'c'])
    })

    it('accepts a custom separator', () => {
      expect(parse('"a"\n"b"', '\n')).to.eql(['a', 'b'])
    })

    it('handles commas inside quoted values', () => {
      expect(parse('"A,B","c"')).to.eql(['A,B', 'c'])
    })

    it('filters out empty values', () => {
      expect(parse('"a",,"b"')).to.eql(['a', 'b'])
    })
  })

  describe('round trip', () => {
    it('joinAsRows -> parse preserves simple values', () => {
      let values = ['Photos', 'Documents', 'Archive']
      expect(parse(join(values, '\n'), '\n')).to.eql(values)
    })

    it('joinAsRows -> parse preserves values with special characters', () => {
      let values = ['say "hello"', 'path/to/thing', 'a,b']
      expect(parse(join(values, '\n'), '\n')).to.eql(values)
    })

    it('joinAsRows -> parse preserves list paths', () => {
      let values = ['Parent\\/Child', 'Root', 'A\\/B\\/C']
      expect(parse(join(values, '\n'), '\n')).to.eql(values)
    })
  })
})
