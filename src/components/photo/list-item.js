import React from 'react'
import { Editable } from '../editable.js'
import { createClickHandler } from '../util.js'
import { PhotoIterable } from './iterable.js'
import { SelectionList } from '../selection/index.js'
import { pluck } from '../../common/util.js'
import { TYPE } from '../../constants/index.js'
import cx from 'classnames'
import { testFocusChange } from '../../dom.js'
import { Icon } from '../icons.js'
import { Button } from '../button.js'


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
  }

  handleSingleClick = () => {
    if (!(this.props.isDisabled || this.props.isDragging)) {
      this.props.onEdit(this.props.photo)
    }
  }

  handleClick = createClickHandler({
    onClick: () => {
      let { isActive } = this
      this.select()
      return !isActive || this.hasFocusChanged()
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
    const { photo, title, onChange, onEditCancel } = this.props

    onChange({
      id: photo.id,
      data: {
        [title]: { text, type: TYPE.TEXT }
      }
    })

    onEditCancel()
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
        active={this.props.selection}
        data={this.props.data}
        edit={this.props.edit.selection}
        isDisabled={this.props.isDisabled}
        isItemOpen={this.props.isItemOpen}
        onChange={this.props.onChange}
        onContextMenu={this.props.onContextMenu}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
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
        icon={<Icon name="Chevron9"/>}
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
            {photo.broken && (
              <Button
                icon={<Icon name="Warning"/>}
                title="photo.consolidate"
                onClick={this.handleConsolidate}/>
            )}
            {isExpandable && <Icon name="Selection"/>}
            <Icon name="Transcription" className="pending"/>
            <Icon name="TranscriptionFailed"/>
          </div>
        </div>
        {this.renderSelectionList()}
      </li>
    )
  }
}


const PhotoListItemContainer = PhotoListItem.wrap()

export {
  PhotoListItemContainer as PhotoListItem
}
