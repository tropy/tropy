'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { SelectionGrid } = require('../selection/grid')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const { match } = require('../../keymap')
const { floor, ceil } = Math
const { GRID } = require('../../constants/sass')


class PhotoGrid extends PhotoIterator {
  get isGrid() { return true }

  get classes() {
    return [super.classes, 'photo-grid', {
      'nested-tab-focus': this.state.hasNestedTabFocus,
      'has-nested-active': this.props.selection != null
    }]
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

    for (let j = 1, k = 1 + floor(idx / cols); j <= exp; ++j, ++k) {
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
    if (this.props.expanded.length === 0) {
      return super.mapIterableRange(fn, range)
    }

    this.mappedRange = range

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
      out.push(this.renderSelectionGrid(exp))
    }

    for (; cur < to; ++cur) {
      let photo = photos[cur]
      out.push(fn(this.getIterableProps(photo, cur)))
    }

    return out
  }

  contract = (photo) => {
    if (this.isExpandable(photo)) {
      this.handleNestedBlur()
      this.props.onContract(this.props.expanded.map(p => p.id))

      if (this.isSelected(photo)) {
        this.props.onSelect({
          photo: photo.id,
          item: photo.item,
          note: photo.notes[0]
        })
      }
    }
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.handlePrevPhoto()
        break
      case (this.isVertical ? 'down' : 'right'):
        this.handleNextPhoto(event)
        break
      case (this.isVertical ? 'left' : 'up'):
        this.select(this.prev(this.state.cols), {
          scrollIntoView: true,
          throttle: true
        })
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.next(this.state.cols), {
          scrollIntoView: true,
          throttle: true
        })
        break
      case 'home':
        this.scroll(0)
        break
      case 'end':
        this.scrollToEnd()
        break
      case 'pageUp':
        this.scrollPageUp()
        break
      case 'pageDown':
        this.scrollPageDown()
        break
      case 'open':
        this.handleItemOpen(this.current())
        break
      case 'preview':
        this.preview(this.current())
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
    event.nativeEvent.stopImmediatePropagation()
  }

  handleNestedTabFocus = () => {
    this.setState({ hasNestedTabFocus: true })
  }

  handleNestedBlur = () => {
    this.setState({ hasNestedTabFocus: false })
  }

  renderSelectionGrid(photo) {
    const selections = pluck(this.props.selections, photo.selections)
    const gridColumnEnd = this.state.cols + 1

    return (
      <li
        key="expansion"
        className="tile-expansion"
        style={{ gridColumnEnd }}>
        <SelectionGrid
          active={this.props.selection}
          cache={this.props.cache}
          cols={this.state.cols}
          data={this.props.data}
          isDisabled={this.props.isDisabled}
          keymap={this.props.keymap.SelectionGrid}
          onBlur={this.handleNestedBlur}
          onTabFocus={this.handleNestedTabFocus}
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
    const { expanded, onBlur } = this.props
    const range = this.getIterableRange()
    const padding = GRID.PADDING * 4
    const [exp, adj] = range.exp

    let { cols, offset, height } = this.state

    if (expanded.length > 0) {
      height += padding
      if (exp > 0 && adj === 0) offset += padding
    }

    const transform = `translate3d(0,${offset}px,0)`
    const gridTemplateColumns = `repeat(${cols}, ${cols}fr)`

    return this.connect(
      <div className={cx(this.classes)}
        data-size={this.props.size}>
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onBlur={onBlur}
          onKeyDown={this.handleKeyDown}>
          <div className="runway" style={{ height }}>
            <ul
              className="viewport"
              style={{ gridTemplateColumns, transform }}>
              {this.mapIterableRange(({ photo, ...props }) => (
                <PhotoTile {...props} key={photo.id} photo={photo}/>
              ), range)}
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
