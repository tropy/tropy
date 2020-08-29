import React from 'react'
import { CoverImage } from '../cover-image'
import { Editable } from '../../editable'
import { TagColors } from '../../colors'
import { createClickHandler } from '../../util'
import { testFocusChange } from '../../../dom'
import { isMeta } from '../../../keymap'
import { auto } from '../../../format'
import { noop } from '../../../common/util'
import cx from 'classnames'

import {
  arrayOf, bool, func, instanceOf, number, object, oneOfType, shape, string
} from 'prop-types'


export class TableCell extends React.PureComponent {
  get classes() {
    return ['metadata', this.props.type, {
      'dragging': this.props.isDragging,
      'main-column': this.props.isMainColumn,
      'moving': this.props.isMoving,
      'read-only': this.props.isReadOnly
    }]
  }

  get canEdit() {
    return !(
      this.props.isReadOnly || this.props.isDisabled || this.props.isEditing
    )
  }

  get display() {
    return this.props.display ||
      auto(this.props.value, this.props.type)
  }

  edit(property) {
    this.props.onEdit({
      column: { [this.props.item.id]: property }
    })
  }

  handleChange = (text) => {
    this.props.onChange(this.props.id, {
      text,
      type: this.props.type
    })
  }

  // Subtle: We want to enable click-to-edit for selected cells only;
  // since selection happens during mouse down and click-to-edit on
  // click, we record the current selection state on mouse down --
  // selections happens as the event bubbles therefore allowing us to
  // detect a click event that was associated to the item's selection.
  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
    this.wasSelected = this.props.isSelected &&
      this.props.getSelection().length === 1
  }

  handleClick = createClickHandler({
    onClick: (event) => (
      this.hasFocusChanged() ||
      !this.props.isSelected ||
      !this.wasSelected ||
      event.shiftKey ||
      isMeta(event)
    ),

    onSingleClick: () => {
      if (this.canEdit) this.edit(this.props.id)
    }
  })

  handleKeyDown = (event, input) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()

      if (input.hasChanged) input.commit(true)

      let next = event.shiftKey ?
        this.props.getPrevColumn(this.props.position) :
        this.props.getNextColumn(this.props.position)

      if (next != null) this.edit(next)
    }
  }

  renderCoverImage() {
    return this.props.isMainColumn && (
      <div className="cover-image-container">
        <CoverImage
          item={this.props.item}
          cache={this.props.cache}
          photos={this.props.photos}
          size={this.props.size}
          onError={this.props.onPhotoError}/>
      </div>
    )
  }

  renderTagColors() {
    return this.props.isMainColumn && (
      <TagColors
        selection={this.props.item.tags}
        tags={this.props.tags}/>
    )
  }

  render() {
    let isDisabled = this.props.isDisabled || this.props.isReadOnly
    return (
      <div
        className={cx('td', this.classes)}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>
        <div className="flex-row center td-container">
          {this.renderCoverImage()}
          <Editable
            display={this.display}
            isActive={this.props.isEditing}
            isDisabled={isDisabled}
            resize
            title={this.props.title}
            value={isDisabled ? null : this.props.value}
            onCancel={this.props.onCancel}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}/>
          {this.renderTagColors()}
        </div>
      </div>
    )
  }

  static propTypes = {
    cache: string,
    display: string,
    id: string.isRequired,
    isDisabled: bool,
    isDragging: bool,
    isEditing: bool,
    isMainColumn: bool,
    isMoving: bool,
    isReadOnly: bool,
    isSelected: bool,
    item: shape({
      id: number.isRequired,
      cover: number,
      photos: arrayOf(number)
    }).isRequired,
    photos: object,
    position: number.isRequired,
    size: number,
    tags: object,
    title: string,
    type: string,
    value: oneOfType([string, number, instanceOf(Date)]),
    getSelection: func.isRequired,
    getNextColumn: func.isRequired,
    getPrevColumn: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onPhotoError: func
  }

  static defaultProps = {
    position: 0,
    size: 48,
    getNextColumn: noop,
    getPrevColumn: noop
  }
}
