'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Editable } = require('../editable')
const { imageURL } = require('../../common/cache')
const { IconItem } = require('../icons')
const cn = require('classnames')

const ICON_SIZE = 24

class TableCell extends Component {

  changed = (value) => {
    this.props.onChange({
      [this.props.property.uri]: { value, type: this.type }
    })
  }

  handleClick = (event) => {
    const { isSelected, onActivate, property } = this.props

    if (isSelected) {
      event.stopPropagation()
      onActivate(property.uri)
    }
  }

  get value() {
    const { data, property } = this.props

    return data[property.uri] ?
      data[property.uri].value : null
  }

  get type() {
    const { data, property } = this.props

    return data[property.uri] ?
      data[property.uri].type : (property.type || 'text')
  }

  get icon() {
    const { item: { cover, photos }, cache } = this.props

    switch (true) {
      case !!(cover):
        return imageURL(cache, cover, ICON_SIZE * 2)
      case !!(photos && photos.length):
        return imageURL(cache, photos[0], ICON_SIZE * 2)
    }
  }

  renderIcon() {
    if (this.props.hasIcon) {
      return <TableCellIcon src={this.icon} size={ICON_SIZE}/>
    }
  }

  render() {
    const {
      isEditing, isDisabled, width, onCancel
    } = this.props

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}
        onClick={this.handleClick}>

        {this.renderIcon()}

        <Editable
          value={this.value}
          isEditing={isEditing}
          isDisabled={isDisabled}
          onCancel={onCancel}
          onChange={this.changed}/>
      </td>
    )
  }


  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isSelected: PropTypes.bool,

    hasIcon: PropTypes.bool,

    property: PropTypes.shape({
      uri: PropTypes.string.isRequired,
      type: PropTypes.string,
    }),

    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      cover: PropTypes.number,
      photos: PropTypes.array
    }).isRequired,

    data: PropTypes.object.isRequired,
    cache: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,

    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }
}


const TableCellIcon = ({ src, size }) => {
  if (!src) return <IconItem/>

  return (
    <img srcSet={`${encodeURI(src)} 2x`} width={size} height={size}/>
  )
}

TableCellIcon.propTypes = {
  src: PropTypes.string,
  size: PropTypes.number.isRequired
}


module.exports = {
  TableCell,
  TableCellIcon
}
