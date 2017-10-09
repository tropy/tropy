'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { SelectionGrid } = require('../selection/grid')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const { match } = require('../../keymap')
const { ceil } = Math
const { GRID } = require('../../constants/sass')


class PhotoGrid extends PhotoIterator {
  get isGrid() { return true }

  get classes() {
    return [super.classes, 'grid']
  }

  getNextRowOffset(index) {
    return index + (this.state.cols - (index % this.state.cols))
  }

  getExpansionRows({ cols } = this.state, props = this.props) {
    const photo = props.expanded[0]
    this.expRows = []

    if (photo == null) return 0

    const exp = ceil(photo.selections.length / cols)
    const idx = this.indexOf(photo.id, props)
    if (idx === -1) return 0

    for (let j = 1, k = ceil(idx / cols); j <= exp; ++j, ++k) {
      this.expRows.push([k, j, j])
    }

    return exp
  }

  isExpanded(photo) {
    return photo.selections != null &&
      photo.selections.length > 0 &&
      this.props.expanded[0] === photo
  }

  mapIterableRange(fn, range = this.getIterableRange()) {
    const { photos } = this.props
    const { from, to } = range

    let out = []
    let cur = from
    let gap = to
    let exp

    for (; cur < gap && cur < to; ++cur) {
      let photo = photos[cur]

      if (this.isExpanded(photo)) {
        exp = photo
        gap = this.getNextRowOffset(cur)
      }

      out.push(fn(this.getIterableProps(photo, cur)))
    }

    if (exp != null) {
      if (gap > to) {
        out = out.concat(this.fill(gap - to, 'gap'))
      }

      out.push(this.renderSelectionGrid(exp))
    }

    for (; cur < to; ++cur) {
      let photo = photos[cur]
      out.push(fn(this.getIterableProps(photo, cur)))
    }

    return out
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.select(this.prev(), true)
        break
      case (this.isVertical ? 'down' : 'right'):
        this.select(this.next(), true)
        break
      case (this.isVertical ? 'left' : 'up'):
        this.select(this.prev(this.state.cols), true)
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.next(this.state.cols), true)
        break
      case 'open':
        this.handleItemOpen(this.current())
        break
      case 'expand':
      case 'enter':
        this.expand(this.current())
        break
      case 'contract':
        this.contract(this.current())
        break
      case 'delete':
        this.handleDelete(this.current())
        this.select(this.next() || this.prev())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }


  renderSelectionGrid(photo) {
    const selections = pluck(this.props.selections, photo.selections)

    return (
      <li key="expansion" className="tile-expansion">
        <SelectionGrid
          cache={this.props.cache}
          active={this.props.selection}
          data={this.props.data}
          isDisabled={this.props.isDisabled}
          keymap={this.props.keymap.SelectionGrid}
          onContextMenu={this.props.onContextMenu}
          onDelete={this.handleDelete}
          onItemOpen={this.handleItemOpen}
          onSelect={this.select}
          onSort={this.props.onSelectionSort}
          photo={photo}
          selections={selections}
          size={this.props.size}/>
      </li>
    )
  }

  render() {
    const { offset, height } = this.state
    const range = this.getIterableRange()
    const [exp, adj] = range.exp
    const pad = (exp > 0 && adj === 0) ? GRID.PADDING * 2 : 0
    const transform = `translate3d(0,${offset + pad}px,0)`

    return this.connect(
      <div className={cx(this.classes)}
        data-size={this.props.size}>
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onKeyDown={this.handleKeyDown}>
          <div className="runway click-catcher" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(({ photo, ...props }) => (
                <PhotoTile {...props} key={photo.id} photo={photo}/>
              ), range)}
              {this.fillRow()}
            </ul>
          </div>
        </div>
      </div>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }
}

module.exports = {
  PhotoGrid: PhotoGrid.asDropTarget()
}
