'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { SelectionGrid } = require('../selection/grid')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const { match } = require('../../keymap')
const { ceil } = Math


class PhotoGrid extends PhotoIterator {
  get isGrid() { return true }

  get classes() {
    return [super.classes, 'grid']
  }

  getNextRowOffset(index) {
    return index + (this.state.cols - (index % this.state.cols))
  }

  getExpansionRows({ cols, rowHeight } = this.state, props = this.props) {
    const photo = props.expanded[0]
    this.expansionRows = []

    if (photo == null) return 0

    const num = ceil(photo.selections.length / cols)
    const idx = this.indexOf(photo)

    const offset = (idx + 1 + num) * rowHeight
    this.expansionRows.push([offset, num])

    return num
  }


  isExpanded(photo) {
    return !photo.pending &&
      this.props.expanded[0] === photo &&
      photo.selections.length > 0
  }

  map(fn) {
    const { photos } = this.props
    const { size } = this
    let out = []
    let cur = 0
    let gap = size
    let exp

    for (; cur < gap && cur < size; ++cur) {
      let photo = photos[cur]

      if (this.isExpanded(photo)) {
        exp = photo
        gap = this.getNextRowOffset(cur)
      }

      out.push(fn(this.getIterableProps(photo, cur)))
    }

    if (exp != null) {
      if (gap > size) {
        out = out.concat(this.fill(gap - size, 'gap'))
      }

      out.push(this.renderSelectionGrid(exp))
    }

    for (; cur < size; ++cur) {
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
    const transform = `translate3d(0,${offset}px,0)`

    return this.connect(
      <div
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        data-size={this.props.size}
        onKeyDown={this.handleKeyDown}>
        <div
          ref={this.setScroller}
          className="scroll-container">
          <div className="runway click-catcher" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(({ photo, ...props }) =>
                <PhotoTile {...props} key={photo.id} photo={photo}/>
              )}
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
