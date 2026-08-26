import { TextLayer } from '#tropy/esper/text-layer.js'

const rect = (x, y, width = 0, height = 0) => ({ x, y, width, height })

describe('esper/TextLayer', () => {
  let text

  const setup = (alto, props = {}) => {
    text = new TextLayer()
    text.sync(props, { text: alto })
    return text
  }

  const selected = (...args) =>
    [...text.select(...args).keys()].map(string => string.CONTENT)

  const stringAt = (...args) =>
    text.getStringAt(...args)?.CONTENT ?? null

  const lines = (...args) =>
    [...text.lines(...args)].map(line => line.children[0].node.CONTENT)

  afterEach(() => {
    text?.destroy()
    text = null
  })

  describe('sync', () => {
    it('mirrors the structure of the document', () => {
      let [block] = setup(F.alto('overlap')).children

      expect(block.children).to.have.length(2)
      expect(block.data).to.eql({ x: 0, y: 0, width: 100, height: 35 })

      expect(block.children.map(line => line.data)).to.eql([
        { x: 0, y: 0, width: 100, height: 20 },
        { x: 0, y: 15, width: 100, height: 20 }
      ])

      expect(block.children.flatMap(line =>
        line.children.map(box => box.node.CONTENT)))
        .to.eql(['one', 'two', 'three', 'four'])
    })

    it('references the alto elements', () => {
      let alto = F.alto('overlap')
      let [block] = Array.from(alto.blocks())

      setup(alto)

      expect(text.children[0].node).to.equal(block)
      expect(text.children[0].children.map(line => line.node))
        .to.eql(Array.from(block.lines()))
    })

    it('flattens composed blocks', () => {
      setup(F.alto('composed'))

      expect(text.children).to.have.length(3)
      expect(selected(rect(0, 0, 40, 80)))
        .to.eql(['cell', 'nested', 'plain'])
    })

    it('is empty without a document', () => {
      setup(undefined)

      expect(text.children).to.be.empty
      expect(text.visible).to.be.false
      expect(selected(rect(0, 0))).to.eql([])
    })
  })

  describe('select', () => {
    beforeEach(() => {
      setup(F.alto('overlap'))
    })

    it('returns nothing without a rectangle', () => {
      expect(selected(null)).to.eql([])
      expect(text.select(null)).to.be.an.instanceof(Map)
    })

    it('returns nothing for clicks outside the text', () => {
      expect(selected(rect(200, 200))).to.eql([])
      expect(selected(rect(25, 100))).to.eql([])
    })

    it('returns the string covering a click', () => {
      expect(selected(rect(25, 5))).to.eql(['one'])
      expect(selected(rect(80, 5))).to.eql(['two'])
      expect(selected(rect(25, 30))).to.eql(['three'])
      expect(selected(rect(80, 30))).to.eql(['four'])
    })

    it('resolves overlapping strings by horizontal position', () => {
      // Both one and two cover x 45-50; the click resolves to
      // whichever box it lies deeper inside.
      expect(selected(rect(46, 5))).to.eql(['one'])
      expect(selected(rect(49, 5))).to.eql(['two'])
    })

    it('resolves overlapping lines by vertical proximity', () => {
      // Both lines cover y 15-20.
      expect(selected(rect(25, 16))).to.eql(['one'])
      expect(selected(rect(25, 19))).to.eql(['three'])
    })

    it('selects every string touched by a rectangle', () => {
      expect(selected(rect(0, 0, 10, 5))).to.eql(['one'])
      expect(selected(rect(0, 0, 100, 5))).to.eql(['one', 'two'])
      expect(selected(rect(0, 0, 100, 40)))
        .to.eql(['one', 'two', 'three', 'four'])
    })

    it('selects strings a rectangle merely touches', () => {
      expect(selected(rect(50, 0, 0, 1))).to.eql(['one', 'two'])
    })

    // Dragging out of two to the right grazes one, which ends inside
    // two; the rectangle must cover a string to select it.
    it('ignores strings a rectangle merely grazes', () => {
      expect(selected(rect(49, 0, 31, 5))).to.eql(['two'])
      expect(selected(rect(10, 0, 39, 5))).to.eql(['one'])
    })

    // The anchor lies inside one, so one is covered less and less as
    // the drag grows; it stays selected all the same.
    it('keeps the string the drag started at', () => {
      expect(selected(rect(46, 0, 34, 5), rect(46, 5)))
        .to.eql(['one', 'two'])
      expect(selected(rect(46, 0, 54, 5), rect(46, 5)))
        .to.eql(['one', 'two'])
    })

    it('resolves the anchor like a click', () => {
      // At x 49 the click resolves to two, so dragging left over one
      // selects both, rather than dropping the string it started at.
      expect(selected(rect(10, 0, 39, 5), rect(49, 5)))
        .to.eql(['two', 'one'])
    })

    // Subtle: the text of a selection is relative to it, so the boxes
    // are offset to bring them into photo coordinates!
    it('offsets the boxes by the photo selection', () => {
      setup(F.alto('overlap'), { selection: { x: 1000, y: 2000 } })

      expect(selected(rect(46, 5))).to.eql([])
      expect(selected(rect(1046, 2005))).to.eql(['one'])
      expect(selected(rect(1049, 2005))).to.eql(['two'])
    })
  })

  describe('getStringAt', () => {
    it('ignores strings, lines and blocks without coordinates', () => {
      setup(F.alto('sparse'))

      expect(stringAt(rect(5, 5))).to.eql('here')
      expect(stringAt(rect(50, 50))).to.be.null
    })

    it('skips lines which cover the point without a string', () => {
      setup(F.alto('straddle'))

      expect(stringAt(rect(40, 16))).to.eql('three')
      expect(stringAt(rect(10, 16))).to.eql('one')
    })
  })

  describe('lines', () => {
    beforeEach(() => {
      setup(F.alto('distant'))
    })

    it('skips blocks which the rectangle misses', () => {
      expect(lines(rect(0, 0))).to.eql(['near'])
      expect(lines(rect(0, 0, 200, 200))).to.eql(['near', 'far'])
      expect(lines(rect(50, 50))).to.eql([])
    })
  })
})
