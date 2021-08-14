import React from 'react'
import { PhotoIterator } from './iterator'
import { PhotoTile } from './tile'
import { SelectionGrid } from '../selection/grid'
import { Scroll } from '../scroll'
import { pluck } from '../../common/util'
import cx from 'classnames'
import { match } from '../../keymap'
import { SASS } from '../../constants'


class PhotoGrid extends PhotoIterator {
  get classes() {
    return [super.classes, 'photo-grid', {
      'nested-tab-focus': this.state.hasNestedTabFocus,
      'has-nested-active': this.props.selection != null
    }]
  }

  getExpansionRows({ cols } = this.state, props = this.props) {
    const photo = props.expanded[0]
    this.expRows = []

    if (photo == null) return 0

    const exp = Math.ceil(photo.selections.length / cols)
    const idx = this.indexOf(photo.id, props)
    if (idx === -1) return 0

    for (let j = 1, k = 1 + Math.floor(idx / cols); j <= exp; ++j, ++k) {
      this.expRows.push([k, j, j])
    }

    return exp
  }

  isExpanded(photo) {
    return photo.selections != null &&
      photo.selections.length > 0 &&
      this.props.expanded[0] === photo
  }

  contract = (photo) => {
    if (this.isExpandable(photo) && this.isExpanded(photo)) {
      this.handleNestedBlur()
      this.props.onContract(this.props.expanded.map(p => p.id))

      if (this.isSelected(photo)) {
        this.props.onSelect({
          photo: photo.id,
          item: photo.item,
          note: photo.notes[0]
        })
      }
      return true
    }

    return false
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
        this.select(this.prev(this.container.current.layout.columns), {
          scrollIntoView: true,
          throttle: true
        })
        break
      case (this.isVertical ? 'right' : 'down'):
        this.select(this.next(this.container.current.layout.columns), {
          scrollIntoView: true,
          throttle: true
        })
        break
      case 'home':
        this.handleHomeKey(event)
        break
      case 'end':
        this.handleEndKey(event)
        break
      case 'pageUp':
        this.handlePageUp(event)
        break
      case 'pageDown':
        this.handlePageDown(event)
        break
      case 'open':
        this.handleItemOpen(this.current())
        break
      case 'preview':
        this.preview(this.current())
        break
      case 'expand':
      case 'enter':
        if (!this.expand(this.current())) return
        break
      case 'contract':
        if (!this.contract(this.current())) return
        break
      case 'delete':
        this.handleDelete(this.current())
        break
      case 'rotateLeft':
        this.handleRotate(-90)
        break
      case 'rotateRight':
        this.handleRotate(90)
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

  renderSelectionGrid = (photo, columns) => (
    <SelectionGrid
      active={this.props.selection}
      cache={this.props.cache}
      cols={columns}
      data={this.props.data}
      isDisabled={this.props.isDisabled}
      keymap={this.props.keymap.SelectionGrid}
      onBlur={this.handleNestedBlur}
      onTabFocus={this.handleNestedTabFocus}
      onContextMenu={this.props.onContextMenu}
      onDelete={this.handleDelete}
      onError={this.props.onError}
      onItemOpen={this.handleItemOpen}
      onRotate={this.handleRotate}
      onSelect={this.select}
      onSort={this.props.onSelectionSort}
      photo={photo}
      selections={pluck(this.props.selections, photo.selections)}
      size={this.props.size}/>
    )

  render() {
    return this.connect(
      <div
        className={cx(this.classes)}
        data-size={this.props.size}>
        <Scroll
          ref={this.container}
          items={this.props.photos}
          itemHeight={this.getRowHeight()}
          itemWidth={this.getRowHeight()}
          expandedItems={this.props.expanded}
          expansionPadding={SASS.GRID.PADDING * 4}
          renderExpansionRow={this.renderSelectionGrid}
          tabIndex={this.tabIndex}
          onBlur={this.props.onBlur}
          onKeyDown={this.handleKeyDown}>
          {(photo, index, { isExpanded }) =>
            <PhotoTile
              {...this.getIterableProps(photo, index)}
              isExpanded={isExpanded}
              key={photo.id}
              photo={photo}/>}
        </Scroll>
      </div>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }
}

const PhotoGridContainer = PhotoGrid.asDropTarget()

export {
  PhotoGridContainer as PhotoGrid
}
