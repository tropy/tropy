'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { meta } = require('../../common/os')
const cn = require('classnames')
const { bool, shape, string, number, object, arrayOf, func } = PropTypes


class ItemTableCell extends Component {

  get value() {
    const { item, property } = this.props

    return item.data[property.uri] ?
      item.data[property.uri].value : null
  }

  get type() {
    const { item, property } = this.props

    return item.data[property.uri] ?
      item.data[property.uri].type : (property.type || 'text')
  }


  handleEdit = () => {
    this.props.onEdit({
      column: { [this.props.item.id]: this.props.property.uri }
    })
  }

  handleChange = (value) => {
    this.props.onChange({
      id: this.props.item.id,
      data: {
        [this.props.property.uri]: { value, type: this.type }
      }
    })
  }

  handleMouseDown = () => {
    this.wasSelected = this.props.isSelected
  }

  handleClick = createClickHandler({
    onClick: (event, cancel) => {
      if (!this.props.isSelected) return cancel()
      if (meta(event)) return cancel()
      if (!this.wasSelected) return cancel()
    },

    onSingleClick: this.handleEdit
  })


  render() {
    const { item, cache, width, hasCoverImage, ...props } = this.props

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>

        {hasCoverImage && <CoverImage item={item} size={24} cache={cache}/>}

        <Editable {...props}
          value={this.value}
          onChange={this.handleChange}/>
      </td>
    )
  }


  static propTypes = {
    isEditing: bool,
    isDisabled: bool,
    isSelected: bool,

    hasCoverImage: bool,

    property: shape({
      uri: string.isRequired,
      type: string,
    }),

    item: shape({
      id: number.isRequired,
      cover: number,
      data: object.isRequired,
      photos: arrayOf(number)
    }).isRequired,

    cache: string.isRequired,
    width: string.isRequired,

    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCancel: func.isRequired,
    onEdit: func.isRequired
  }
}


module.exports = {
  ItemTableCell
}
