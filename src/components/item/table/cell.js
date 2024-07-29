import React from 'react'
import cx from 'classnames'
import { CoverImage } from '../cover-image.js'
import { Editable } from '../../editable.js'
import { TagColors } from '../../tag/colors.js'
import { createClickHandler } from '../../util.js'
import { testFocusChange } from '../../../dom.js'
import { isMeta } from '../../../keymap.js'
import { auto } from '../../../format.js'
import { noop } from '../../../common/util.js'

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
    this.props.onCancel()
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
          cover={this.props.item.cover}
          photos={this.props.item.photos}
          size={this.props.size}/>
      </div>
    )
  }

  renderTagColors() {
    return this.props.isMainColumn && (
      <TagColors tags={this.props.item.tags}/>
    )
  }

  render() {
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
            isDisabled={this.props.isDisabled}
            isReadOnly={this.props.isReadOnly}
            resize
            title={this.props.title}
            value={this.props.value}
            onCancel={this.props.onCancel}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}/>
          {this.renderTagColors()}
        </div>
      </div>
    )
  }

  static defaultProps = {
    position: 0,
    size: 48,
    getNextColumn: noop,
    getPrevColumn: noop
  }
}
