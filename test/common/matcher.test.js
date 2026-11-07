import { Database } from '#tropy/common/db.js'
import { createMatcher, snippet, tokenize } from '#tropy/common/matcher.js'
import { parse } from '#tropy/common/search.js'

describe('common/matcher', () => {
  const matcher = (query) => createMatcher(parse(query).terms)
  const texts = (text) => tokenize(text).map(t => t.text)

  describe('tokenize', () => {
    it('splits letters and numbers at everything else', () => {
      expect(tokenize('O\'Brien, 1990-12')).to.eql([
        { start: 0, end: 1, text: 'o' },
        { start: 2, end: 7, text: 'brien' },
        { start: 9, end: 13, text: '1990' },
        { start: 14, end: 16, text: '12' }
      ])
      expect(texts('snake_case 😀 x')).to.eql(['snake', 'case', 'x'])
    })

    it('folds case and removes marks', () => {
      expect(texts('Café Café Tiếng İstanbul')).to.eql(
        ['cafe', 'cafe', 'tieng', 'istanbul'])
      expect(texts('Ἀθῆναι ΛΟΓΟΣ λόγος')).to.eql(
        ['αθηναι', 'λογοσ', 'λογοσ'])
      expect(texts('Straße Łódź')).to.eql(['straße', 'łodz'])
    })
  })

  describe('ranges', () => {
    it('marks the matched prefix of words and unclosed phrases', () => {
      expect(matcher('caf').ranges('Café crème', 'metadata')).to.eql([[0, 3]])
      expect(matcher('"cafe cr').ranges('Café crème', 'metadata'))
        .to.eql([[0, 7]])
      expect(matcher('o\'bri').ranges('Letter from O\'Brien', 'metadata'))
        .to.eql([[12, 17]])
      expect(matcher('letter').ranges('Letter', 'metadata')).to.eql([[0, 6]])
    })

    it('keeps marks with their letter', () => {
      expect(matcher('cafe').ranges('Cafe\u0301s', 'metadata'))
        .to.eql([[0, 5]])
    })

    it('matches closed phrases exactly', () => {
      let m = matcher('"letter from"')

      expect(m.ranges('A letter from home', 'note')).to.eql([[2, 13]])
      expect(m.ranges('A letter fromage', 'note')).to.eql([])
      expect(m.ranges('from letter', 'note')).to.eql([])
    })

    it('merges overlapping matches', () => {
      expect(matcher('box bo "box 3"').ranges('Box 3, box', 'metadata'))
        .to.eql([[0, 5], [7, 10]])
    })

    it('applies terms of the given scope only', () => {
      let m = matcher('note:box tag:war letter')

      expect(m.ranges('box letter', 'metadata')).to.eql([[4, 10]])
      expect(m.ranges('box letter', 'note')).to.eql([[0, 3], [4, 10]])
      expect(m.ranges('World_War', 'tag')).to.eql([[6, 9]])
    })

    it('matches tag names by substring', () => {
      expect(matcher('ld_wa').ranges('World_War', 'tag')).to.eql([[3, 8]])
      expect(matcher('ld_wa').ranges('World_War', 'metadata')).to.eql([])
    })

    it('marks nothing without terms or tokens', () => {
      expect(matcher('').ranges('box', 'metadata')).to.eql([])
      expect(matcher('-').ranges('a - b', 'metadata')).to.eql([])
      expect(matcher('box').ranges('', 'metadata')).to.eql([])
    })
  })

  describe('snippet', () => {
    const marked = ({ text, ranges }) =>
      ranges.map(([start, end]) => text.slice(start, end))

    let text = 'one two three four five six seven eight nine ten'

    it('cuts the text to its matches at whitespace', () => {
      let s = snippet(text, [[14, 18], [40, 44]], { size: 20, context: 6 })

      expect(s.text).to.equal('…three four five … eight nine ten')
      expect(marked(s)).to.eql(['four', 'nine'])
    })

    it('leaves out matches past the size', () => {
      let s = snippet(text, [[0, 3], [40, 44]], { size: 5, context: 4 })

      expect(s.text).to.equal('one two…')
      expect(marked(s)).to.eql(['one'])
    })
  })

  // The search runs in FTS5: whatever it finds must be marked.
  // (Marking more is fine, e.g. accents FTS5 keeps.)
  describe('compared to FTS5', () => {
    let db = new Database(':memory:', 'w+', { max: 1 })

    let corpus = [
      'Letter from O\'Brien, 1990-12-03', 'Café crème', 'Café',
      'Ἀθῆναι', 'Москва, ёлка, йод', 'Straße', 'İstanbul', 'Łódź',
      'Tiếng Việt', '東京大学', 'ひらがな カタカナ', '한국어',
      'हिन्दी नमस्ते', 'عَرَبِيّ', 'snake_case rock-n-roll', 'x² ① ⅻ',
      'ﬁne ＡＢＣ', 'ΛΟΓΟΣ λόγος', 'Box 3: Folder 12', 'ǅemal Ǯ ǡ'
    ]

    before(async () => {
      await db.exec(`
        CREATE VIRTUAL TABLE t USING fts5(
          text, tokenize = 'unicode61 remove_diacritics 2')`)

      for (let [i, text] of corpus.entries())
        await db.run('INSERT INTO t (rowid, text) VALUES (?, ?)', i, text)
    })

    after(() => db.close())

    it('marks every FTS5 match', async () => {
      // Every word of the corpus, and its first one to three characters.
      let queries = new Set()

      for (let text of corpus) {
        for (let word of text.split(/\s+/)) {
          let chars = [...word]
          queries.add(word)
          for (let n = 1; n <= 3; ++n) queries.add(chars.slice(0, n).join(''))
        }
      }

      let missed = []
      let checked = 0

      for (let query of queries) {
        for (let term of parse(query).terms) {
          let fts = `"${term.text}"${term.prefix ? '*' : ''}`
          let rows

          try {
            rows = await db.all('SELECT rowid AS i FROM t WHERE t MATCH ?', fts)
          } catch {
            continue // Not a valid FTS5 phrase (e.g. no tokens).
          }

          let m = createMatcher([term])

          for (let { i } of rows) {
            checked++
            if (!m.test(corpus[i], 'metadata'))
              missed.push(`${query} in ${corpus[i]}`)
          }
        }
      }

      expect(missed).to.eql([])
      expect(checked).to.be.above(100)
    })
  })
})
