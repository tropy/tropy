import React from 'react'
import { Editable } from '../editable'
import { createClickHandler } from '../util'
import { PhotoIterable } from './iterable'
import { SelectionList } from '../selection'
import { pluck } from '../../common/util'
import { TYPE } from '../../constants'
import cx from 'classnames'
import { testFocusChange } from '../../dom'
import { bool, func, object, string } from 'prop-types'
import { IconSelection, IconChevron9, IconWarning } from '../icons'
import { Button } from '../button'
import { isMeta } from '../../keymap'


class PhotoListItem extends PhotoIterable {
  get classes() {
    return [...super.classes, { active: this.isActive }]
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  get selections() {
    return pluck(this.props.selections, this.props.photo.selections)
  }

  get title() {
    let { data, photo, title } = this.props
    return data?.[photo.id]?.[title]?.text
  }

  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
    this.wasSelected = this.props.isSelected && !this.props.isRangeSelected
  }

  handleSingleClick = () => {
    if (!(this.props.isDisabled || this.props.isDragging)) {
      this.props.onEdit(this.props.photo)
    }
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      let { isActive } = this
      this.select(event)
      return !isActive ||
        this.hasFocusChanged() ||
        !this.wasSelected ||
        event.shiftKey ||
        isMeta(event)
    },

    onSingleClick: this.handleSingleClick,

    onDoubleClick: () => {
      if (!this.props.isItemOpen) {
        this.props.onItemOpen(this.props.photo)
      } else {
        this.handleSingleClick()
      }
    }
  })


  handleChange = (text) => {
    const { photo, title, onChange } = this.props

    onChange({
      id: photo.id,
      data: {
        [title]: { text, type: TYPE.TEXT }
      }
    })
  }

  handleTwistyButtonClick = (event) => {
    event.stopPropagation()

    if (this.props.isExpanded) this.contract()
    else this.expand()
  }


  renderSelectionList() {
    if (!this.props.isExpanded) return null

    return (
      <SelectionList
        cache={this.props.cache}
        active={this.props.selection}
        data={this.props.data}
        edit={this.props.edit.selection}
        isDisabled={this.props.isDisabled}
        isItemOpen={this.props.isItemOpen}
        onChange={this.props.onChange}
        onContextMenu={this.props.onContextMenu}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
        onError={this.props.onError}
        onItemOpen={this.props.onItemOpen}
        onSelect={this.props.onSelect}
        onSort={this.props.onSelectionSort}
        photo={this.props.photo}
        selections={this.selections}/>
    )
  }

  renderTwistyButton() {
    return this.props.isExpandable && (
      <Button
        noFocus
        icon={<IconChevron9/>}
        className="disclosure"
        onClick={this.handleTwistyButtonClick}/>
    )
  }

  render() {
    const {
      isDisabled,
      isEditing,
      isExpandable,
      onEditCancel,
      photo
    } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.container}>
        <div
          className="photo-container"
          onClick={this.handleClick}
          onContextMenu={this.handleContextMenu}
          onMouseDown={this.handleMouseDown}>
          {this.renderTwistyButton()}
          <div className="thumbnail-container">
            {this.renderThumbnail()}
          </div>
          <div className="title">
            <Editable
              value={this.title}
              resize
              isActive={isEditing}
              isDisabled={isDisabled}
              onCancel={onEditCancel}
              onChange={this.handleChange}/>
          </div>
          <div className="icon-container">
            {photo.broken &&
              <Button
                icon={<IconWarning/>}
                title="photo.consolidate"
                onClick={this.handleConsolidate}/>}
            {isExpandable && <IconSelection/>}
          </div>
        </div>
        {this.renderSelectionList()}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,
    data: object.isRequired,
    edit: object.isRequired,
    isEditing: bool.isRequired,
    isExpanded: bool.isRequired,
    selections: object.isRequired,
    title: string.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onSelectionSort: func.isRequired
  }
}


const PhotoListItemContainer = PhotoListItem.wrap()

export {
  PhotoListItemContainer as PhotoListItem
}
