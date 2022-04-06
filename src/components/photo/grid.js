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
    return ['photo-grid', super.classes, {
      'nested-tab-focus': this.state.hasNestedTabFocus,
      'has-nested-active': this.props.selection != null
    }]
  }

  contract = (photo) => {
    if (this.isExpandable(photo) && this.isExpanded(photo)) {
      this.handleNestedBlur()
      this.props.onContract(this.props.photos.map(p => p.id))

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
      case 'open':
        this.handleItemOpen(this.current)
        break
      case 'preview':
        this.preview(this.current)
        break
      case 'expand':
      case 'enter':
        if (!this.expand(this.current)) return
        break
      case 'contract':
        if (!this.contract(this.current)) return
        break
      case 'delete':
        this.handleDelete(this.current)
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
    let tileSize = Math.round(this.props.size * SASS.TILE.FACTOR)

    return this.connect(
      <div
        className={cx(this.classes)}
        data-size={this.props.size}>
        <Scroll
          ref={this.container}
          cursor={this.props.selectedPhotos.at(-1)}
          items={this.props.photos}
          itemHeight={tileSize}
          itemWidth={tileSize}
          expandedItems={this.props.expandedPhotos}
          expansionPadding={SASS.GRID.PADDING * 4}
          renderExpansionRow={this.renderSelectionGrid}
          tabIndex={this.tabIndex}
          onBlur={this.props.onBlur}
          onKeyDown={this.handleKeyDown}
          onSelect={this.handleSelectPhoto}
          onTabFocus={this.props.onTabFocus}>
          {(photo, index, { isExpanded }) =>
            <PhotoTile
              {...this.getIterableProps(photo)}
              key={photo.id}
              photo={photo}
              isExpanded={isExpanded}
              isLast={index >= this.props.photos.length - 1}/>}
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
