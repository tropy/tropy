'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { noop } = __require('common/util')

const PHOTO = {
  1: { id: 1, selections: [] },
  2: { id: 2, selections: [] },
  3: { id: 3, selections: [1] },
  4: { id: 4, selections: [] },
  5: { id: 5, selections: [] },
  6: { id: 6, selections: [2, 3, 4] },
  7: { id: 7, selections: [] }
}

describe('PhotoList', () => {
  const { PhotoList } = __require('components/photo/list')

  it.skip('has classes photo and list', () => {
    expect(shallow(
      <PhotoList
        photos={[]}
        dt={noop}/>)).to.have.className('photo list')
  })

  describe('Layout', () => {
    let list, props

    beforeEach(() => {
      props = { expanded: [], photos: [] }
      list = new PhotoList.DecoratedComponent(props)
    })

    describe('.getExpansionRows()', () => {
      it('computes expansion row offsets', () => {
        expect(list.getExpansionRows(undefined, props)).to.eql(0)
        expect(list.expRows).to.eql([])

        props.photos = [
          PHOTO[1], PHOTO[2], PHOTO[3], PHOTO[4], PHOTO[5], PHOTO[6], PHOTO[7]
        ]

        expect(list.getExpansionRows(undefined, props)).to.eql(0)
        expect(list.expRows).to.eql([])

        props.expanded = [PHOTO[3], PHOTO[6]]

        expect(list.getExpansionRows(undefined, props)).to.eql(4)
        expect(list.expRows)
          .to.eql([[3, 1, 1], [7, 2, 1], [8, 3, 2], [9, 4, 3]])
      })
    })

    describe('.getExpansionRowsBefore()', () => {
      it('returns 0 by default', () => {
        expect(list.getExpansionRowsBefore(0)).to.eql([0, 0])
        expect(list.getExpansionRowsBefore(8)).to.eql([0, 0])
      })

      it('computes expansions before given row', () => {
        props.photos = [
          PHOTO[1], PHOTO[2], PHOTO[3], PHOTO[4], PHOTO[5], PHOTO[6], PHOTO[7]
        ]
        props.expanded = [PHOTO[3], PHOTO[6]]

        list.getExpansionRows(undefined, props)

        expect(list.getExpansionRowsBefore(0)).to.eql([0, 0])
        expect(list.getExpansionRowsBefore(1)).to.eql([0, 0])
        expect(list.getExpansionRowsBefore(2)).to.eql([0, 0])
        expect(list.getExpansionRowsBefore(3)).to.eql([1, 1])
        expect(list.getExpansionRowsBefore(4)).to.eql([1, 0])
        expect(list.getExpansionRowsBefore(5)).to.eql([1, 0])
        expect(list.getExpansionRowsBefore(6)).to.eql([1, 0])
        expect(list.getExpansionRowsBefore(7)).to.eql([2, 1])
        expect(list.getExpansionRowsBefore(8)).to.eql([3, 2])
        expect(list.getExpansionRowsBefore(9)).to.eql([4, 3])
        expect(list.getExpansionRowsBefore(10)).to.eql([4, 0])
        expect(list.getExpansionRowsBefore(11)).to.eql([4, 0])
      })
    })

    describe('.getOffset()', () => {
      it('adjusts offset to expansion rows', () => {
        const state = {
          rowHeight: 30,
          viewportRows: 2,
          overscan: 4,
          maxOffset: 210
        }

        props.photos = [
          PHOTO[1], PHOTO[2], PHOTO[3], PHOTO[4], PHOTO[5], PHOTO[6], PHOTO[7]
        ]
        list.getExpansionRows(undefined, props)

        list.container = { scrollTop: 0 }
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 10
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 40
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 60
        expect(list.getOffset(state)).to.eql(30)
        list.container.scrollTop = 100
        expect(list.getOffset(state)).to.eql(60)
        list.container.scrollTop = 120
        expect(list.getOffset(state)).to.eql(90)
        list.container.scrollTop = 150
        expect(list.getOffset(state)).to.eql(120)
        list.container.scrollTop = 180
        expect(list.getOffset(state)).to.eql(150)
        list.container.scrollTop = 240
        expect(list.getOffset(state)).to.eql(210)
        list.container.scrollTop = 270
        expect(list.getOffset(state)).to.eql(210)

        state.maxOffset =  600

        expect(list.getOffset(state)).to.eql(240)
        list.container.scrollTop = 300
        expect(list.getOffset(state)).to.eql(270)
        list.container.scrollTop = 330
        expect(list.getOffset(state)).to.eql(300)
        list.container.scrollTop = 360
        expect(list.getOffset(state)).to.eql(330)


        props.expanded = [PHOTO[3], PHOTO[6]]
        list.getExpansionRows(undefined, props)

        list.container = { scrollTop: 0 }
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 10
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 40
        expect(list.getOffset(state)).to.eql(0)
        list.container.scrollTop = 60
        expect(list.getOffset(state)).to.eql(30)
        list.container.scrollTop = 100
        expect(list.getOffset(state)).to.eql(60)
        list.container.scrollTop = 120
        expect(list.getOffset(state)).to.eql(60)
        list.container.scrollTop = 150
        expect(list.getOffset(state)).to.eql(120)
        list.container.scrollTop = 180
        expect(list.getOffset(state)).to.eql(150)
        list.container.scrollTop = 210
        expect(list.getOffset(state)).to.eql(180)
        list.container.scrollTop = 240
        expect(list.getOffset(state)).to.eql(180)
        list.container.scrollTop = 270
        expect(list.getOffset(state)).to.eql(180)
        list.container.scrollTop = 300
        expect(list.getOffset(state)).to.eql(180)
        list.container.scrollTop = 330
        expect(list.getOffset(state)).to.eql(300)
        list.container.scrollTop = 360
        expect(list.getOffset(state)).to.eql(330)
      })
    })

    describe('.getIterableRange()', () => {
      it('adjusts offset to expansion rows', () => {
        list.state = {
          cols: 1,
          rowHeight: 30,
          overscan: 4,
          offset: 0
        }

        props.photos = [
          PHOTO[1], PHOTO[2], PHOTO[3], PHOTO[4], PHOTO[5], PHOTO[6], PHOTO[7]
        ]
        list.getExpansionRows(undefined, props)

        expect(list.getIterableRange().from).to.eql(0)

        list.state.offset = 30
        expect(list.getIterableRange().from).to.eql(1)
        list.state.offset = 60
        expect(list.getIterableRange().from).to.eql(2)
        list.state.offset = 90
        expect(list.getIterableRange().from).to.eql(3)
        list.state.offset = 120
        expect(list.getIterableRange().from).to.eql(4)
        list.state.offset = 150
        expect(list.getIterableRange().from).to.eql(5)
        list.state.offset = 180
        expect(list.getIterableRange().from).to.eql(6)
        list.state.offset = 210
        expect(list.getIterableRange().from).to.eql(7)
        list.state.offset = 240
        expect(list.getIterableRange().from).to.eql(8)
        list.state.offset = 270
        expect(list.getIterableRange().from).to.eql(9)
        list.state.offset = 300
        expect(list.getIterableRange().from).to.eql(10)
        list.state.offset = 330
        expect(list.getIterableRange().from).to.eql(11)

        props.expanded = [PHOTO[3], PHOTO[6]]
        list.getExpansionRows(undefined, props)

        list.state.offset = 30
        expect(list.getIterableRange().from).to.eql(1)
        list.state.offset = 60
        expect(list.getIterableRange().from).to.eql(2)
        list.state.offset = 90
        expect(list.getIterableRange().from).to.eql(2)
        list.state.offset = 120
        expect(list.getIterableRange().from).to.eql(3)
        list.state.offset = 150
        expect(list.getIterableRange().from).to.eql(4)
        list.state.offset = 180
        expect(list.getIterableRange().from).to.eql(5)
        list.state.offset = 210
        expect(list.getIterableRange().from).to.eql(5)
        list.state.offset = 240
        expect(list.getIterableRange().from).to.eql(5)
        list.state.offset = 270
        expect(list.getIterableRange().from).to.eql(5)
        list.state.offset = 300
        expect(list.getIterableRange().from).to.eql(6)
        list.state.offset = 330
        expect(list.getIterableRange().from).to.eql(7)
      })
    })
  })
})
