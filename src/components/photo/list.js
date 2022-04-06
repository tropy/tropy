import React from 'react'
import { Scroll } from '../scroll'
import { object, func } from 'prop-types'
import { PhotoListItem } from './list-item'
import { PhotoIterator } from './iterator'
import { SASS } from '../../constants'
import { dc } from '../../ontology'
import cx from 'classnames'
import { match } from '../../keymap'


class PhotoList extends PhotoIterator {
  get classes() {
    return ['photo-list', super.classes]
  }

  isEditing(photo) {
    return this.props.edit.photo === photo.id
  }

  edit = (photo) => {
    if (photo != null && !this.props.isDisabled) {
      const { id, selection } = photo

      if (selection == null) {
        this.props.onEdit({ photo: id })
      } else {
        this.props.onEdit({ selection })
      }
    }
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.current.focus()
  }

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.keymap, event)) {
      case 'left':
      case 'contract':
        if (!this.contract(this.current)) return
        break
      case 'right':
      case 'expand':
        if (!this.expand(this.current)) return
        break
      case 'edit':
      case 'enter':
        this.edit(this.current)
        break
      case 'open':
        this.handleItemOpen(this.current)
        break
      case 'preview':
        this.preview(this.current)
        break
      case 'rotateLeft':
        this.handleRotate(-90)
        break
      case 'rotateRight':
        this.handleRotate(90)
        break
      case 'delete':
        this.handleDelete(this.current)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }


  render() {
    const { data, edit, onBlur, onChange } = this.props

    return this.connect(
      <div className={cx(this.classes)}>
        <Scroll
          ref={this.container}
          expansionCursor={this.props.selection}
          items={this.props.photos}
          itemHeight={SASS.ROW.HEIGHT}
          expandedItems={this.props.expandedPhotos}
          selectedItems={this.props.selectedPhotos}
          tabIndex={this.tabIndex}
          onBlur={onBlur}
          onKeyDown={this.handleKeyDown}
          onSelect={this.handleSelect}
          onTabFocus={this.props.onTabFocus}>
          {(photo, index, { isExpanded, isSelected, onSelect }) =>
            <PhotoListItem {...this.getIterableProps(photo)}
              key={photo.id}
              photo={photo}
              data={data}
              edit={edit}
              selections={this.props.selections}
              title={dc.title}
              isExpanded={isExpanded}
              isSelected={isSelected}
              isEditing={this.isEditing(photo)}
              onChange={onChange}
              onEdit={this.edit}
              onEditCancel={this.handleEditCancel}
              onSelect={onSelect}
              onSelectionSort={this.props.onSelectionSort}/>}
        </Scroll>
      </div>
    )
  }

  static propTypes = {
    ...PhotoIterator.propTypes,
    edit: object.isRequired,
    data: object.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }

  static defaultProps = {
    ...PhotoIterator.defaultProps,
    edit: {}
  }
}


const PhotoListContainer = PhotoList.asDropTarget()

export {
  PhotoListContainer as PhotoList
}
