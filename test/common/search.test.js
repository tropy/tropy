import { expands, parse, serialize } from '#tropy/common/search.js'

describe('common/search', () => {
  const word = (text, scope = 'any') =>
    ({ text, phrase: false, prefix: true, scope })

  const phrase = (text, prefix = false, scope = 'any') =>
    ({ text, phrase: true, prefix, scope })

  describe('parse', () => {
    it('splits words and phrases', () => {
      expect(parse('box "letter from" "folder 1').terms).to.eql([
        word('box'),
        phrase('letter from'),
        phrase('folder 1', true)
      ])
      expect(parse('  ').terms).to.eql([])
      expect(parse('""').terms).to.eql([])
    })

    it('keeps unknown syntax as words', () => {
      expect(parse('1990-12 a:b dc:title -0500 (OR').terms).to.eql(
        ['1990-12', 'a:b', 'dc:title', '-0500', '(OR'].map(t => word(t)))
    })

    it('recognizes scopes and their aliases', () => {
      expect(parse('tag:war Note:x tr:y meta:"a b" transcription:z').terms)
        .to.eql([
          word('war', 'tag'),
          word('x', 'note'),
          word('y', 'transcription'),
          phrase('a b', false, 'metadata'),
          word('z', 'transcription')
        ])
    })

    it('drops duplicate terms', () => {
      expect(parse('box BOX tag:box "box').terms)
        .to.eql([word('box'), word('box', 'tag')])
    })

    it('ignores scopes without a value', () => {
      expect(parse('box tag: note:""')).to.eql({
        terms: [word('box')],
        errors: []
      })
    })

    it('reports too many terms', () => {
      let query = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
      let { terms, errors } = parse(query)

      expect(terms).to.have.length(32)
      expect(errors).to.eql([
        { code: 'too-many-terms', offset: query.indexOf('w32'), length: 3 }
      ])

      expect(parse('box '.repeat(100)).errors).to.eql([])
    })
  })

  describe('serialize', () => {
    it('writes the canonical query', () => {
      expect(serialize(parse('  box  meta:"a b"  tr:x "open').terms))
        .to.equal('box metadata:"a b" transcription:x "open')
    })

    it('round-trips any input', () => {
      // A seeded generator: the same inputs on every run.
      let seed = 42
      let random = () => (seed = (seed * 16807) % 2147483647) / 2147483647

      let parts = [
        'a', 'B', 'é', '1', '-', ':', '"', ' ', '  ', '\t',
        'tag:', 'tr:', 'note:', 'Meta:', 'x:'
      ]

      for (let i = 0; i < 500; ++i) {
        let query = Array.from({ length: 1 + random() * 12 },
          () => parts[Math.floor(random() * parts.length)]).join('')

        let { terms } = parse(query)
        let text = serialize(terms)

        expect(parse(text).terms, JSON.stringify(query)).to.eql(terms)
        expect(serialize(parse(text).terms)).to.equal(text)
      }
    })
  })

  describe('expands', () => {
    it('is true when the new query can only widen the results', () => {
      expect(expands('box', '')).to.be.true
      expect(expands('box lett', 'box let')).to.be.true
      expect(expands('box lett', 'lett')).to.be.true
      expect(expands('"letter from"', '"letter from')).to.be.true
      expect(expands('box tag:x', 'box tag:')).to.be.true
      expect(expands('tag:box', 'box')).to.be.true
      expect(expands('Box', 'box')).to.be.true
    })

    it('is false when the new query may narrow them', () => {
      expect(expands('', 'box')).to.be.false
      expect(expands('box let', 'box lett')).to.be.false
      expect(expands('box tag:', 'box tag')).to.be.false
      expect(expands('box', 'tag:box')).to.be.false
      expect(expands('box', '"box"')).to.be.false

      // Invalid (too many terms): never expands.
      let many = Array.from({ length: 33 }, (_, i) => `w${i}`).join(' ')
      expect(expands(many, '')).to.be.false
    })
  })
})
