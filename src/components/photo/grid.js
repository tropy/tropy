'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const { SelectionGrid } = require('../selection/grid')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const { match } = require('../../keymap')


class PhotoGrid extends PhotoIterator {
  get isGrid() { return true }

  get classes() {
    return [super.classes, 'grid']
  }

  getNextRowOffset(index) {
    return index + (this.state.cols - (index % this.state.cols))
  }

  isExpanded(photo) {
    return !photo.pending &&
      this.props.expanded[0] === photo.id &&
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
        this.select(this.getPrev())
        break
      case (this.isVertical ? 'down' : 'right'):
        this.select(this.getNext())
        break
      case (this.isVertical ? 'left' : 'up'):
        this.select(this.getPrev(this.state.cols))
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.getNext(this.state.cols))
        break
      case 'open':
        this.handleItemOpen(this.getCurrent())
        break
      case 'expand':
      case 'enter':
        this.expand(this.getCurrent())
        break
      case 'contract':
        this.contract(this.getCurrent())
        break
      case 'delete':
        this.handleDelete(this.getCurrent())
        this.select(this.getNext() || this.getPrev())
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
    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        data-size={this.props.size}
        onKeyDown={this.handleKeyDown}>
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props} key={photo.id} photo={photo}/>
        )}
        {this.fillRow()}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }
}

module.exports = {
  PhotoGrid: PhotoGrid.asDropTarget()
}
