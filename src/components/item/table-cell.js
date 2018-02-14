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
  arrayOf, bool, func, number, object, oneOfType, shape, string
} = require('prop-types')


const BlankTableCell = () => (
  <td className="blank"/>
)

class ItemTableCell extends PureComponent {
  get classes() {
    return ['metadata', this.props.type, {
      'main-column': this.props.isMainColumn,
      'read-only': this.props.isReadOnly
    }]
  }

  get canEdit() {
    return !(
      this.props.isReadOnly || this.props.isDisabled || this.props.isEditing
    )
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
        [this.props.id]: { text, type: this.props.type }
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
      if (this.canEdit) this.edit(this.props.id)
    }
  })

  handleKeyDown = (event, input) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()

      if (input.hasChanged) input.commit(true)

      const next = event.shiftKey ?
        this.props.prevColumn :
        this.props.nextColumn

      if (next != null) this.edit(next)
    }
  }

  renderCoverImage() {
    return this.props.isMainColumn && (
      <CoverImage
        item={this.props.item}
        cache={this.props.cache}
        photos={this.props.photos}
        size={this.props.size}
        onError={this.props.onPhotoError}/>
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
    return (
      <td
        className={cx(this.classes)}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>
        <div className="flex-row center td-container">
          {this.renderCoverImage()}
          <Editable
            display={auto(this.props.value, this.props.type)}
            isActive={this.props.isEditing}
            isDisabled={this.props.isDisabled || this.props.isReadOnly}
            resize
            value={this.props.value}
            onCancel={this.props.onCancel}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}/>
          {this.renderTagColors()}
        </div>
      </td>
    )
  }

  static propTypes = {
    cache: string,
    id: string.isRequired,
    isDisabled: bool,
    isEditing: bool,
    isMainColumn: bool,
    isReadOnly: bool,
    isSelected: bool,
    item: shape({
      id: number.isRequired,
      cover: number,
      photos: arrayOf(number)
    }).isRequired,
    nextColumn: string,
    photos: object,
    prevColumn: string,
    size: number,
    tags: object,
    type: string.isRequired,
    value: oneOfType([string, number]),
    getSelection: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onPhotoError: func
  }

  static defaultProps = {
    size: 48,
    type: TYPE.TEXT
  }
}


module.exports = {
  BlankTableCell,
  ItemTableCell
}
