'use strict'

const React = require('react')
const { PureComponent } = React
const { CoverImage } = require('./cover-image')
const { Editable } = require('../editable')
const { TagColors } = require('../colors')
const { createClickHandler } = require('../util')
const { testFocusChange } = require('../../dom')
const { isMeta } = require('../../keymap')
const { auto } = require('../../format')
const cx = require('classnames')
const { TYPE } = require('../../constants')
const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')


class ItemTableCell extends PureComponent {
  get style() {
    return {
      width: `${this.props.width}%`
    }
  }

  get value() {
    const { data, property } = this.props

    return data[property.id] ?
      data[property.id].text : null
  }

  get type() {
    const { data, property } = this.props

    return data[property.id] ?
      data[property.id].type : TYPE.TEXT
  }

  edit(property) {
    this.props.onEdit({
      column: { [this.props.item.id]: property }
    })
  }

  handleChange = (text) => {
    this.props.onChange({
      id: this.props.item.id,
      data: {
        [this.props.property.id]: { text, type: this.type }
      }
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
      if (!this.props.isEditing) {
        this.edit(this.props.property.id)
      }
    }
  })

  handleKeyDown = (event, input) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()

      if (input.hasChanged) input.commit(true)

      this.edit(event.shiftKey ?
        this.props.prevColumn :
        this.props.nextColumn )

    }
  }

  render() {
    const {
      item,
      cache,
      photos,
      size,
      tags,
      isEditing,
      isDisabled,
      isMainColumn,
      onCancel,
      onPhotoError
    } = this.props

    const { type, value } = this

    return (
      <td
        className={cx({ metadata: true, [type]: true })}
        style={this.style}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>
        <div className="flex-row center">
          {isMainColumn &&
            <CoverImage
              item={item}
              cache={cache}
              photos={photos}
              size={size}
              onError={onPhotoError}/>}
          <Editable
            value={value}
            display={auto(value, type)}
            resize
            isActive={isEditing}
            isDisabled={isDisabled}
            onCancel={onCancel}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}/>
          {isMainColumn &&
            <TagColors
              selection={item.tags}
              tags={tags}/>}
        </div>
      </td>
    )
  }

  static propTypes = {
    isEditing: bool,
    isDisabled: bool,
    isSelected: bool,
    isMainColumn: bool,

    property: shape({
      id: string.isRequired,
      type: string,
    }),

    nextColumn: string.isRequired,
    prevColumn: string.isRequired,

    item: shape({
      id: number.isRequired,
      cover: number,
      photos: arrayOf(number)
    }).isRequired,

    data: object.isRequired,
    photos: object,
    tags: object,

    cache: string.isRequired,
    width: number.isRequired,
    size: number.isRequired,

    getSelection: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onPhotoError: func.isRequired
  }

  static defaultProps = {
    data: {},
    size: 48
  }
}


module.exports = {
  ItemTableCell
}
