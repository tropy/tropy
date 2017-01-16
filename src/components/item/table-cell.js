'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const cn = require('classnames')


class TableCell extends Component {

  handleChange = (value) => {
    this.props.onChange({
      id: this.props.item.id,
      data: {
        [this.props.property.uri]: { value, type: this.type }
      }
    })
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      this.props.onClick(event)
    },

    onSingleClick: () => {
      const { item, property, onSingleClick } = this.props
      onSingleClick({ id: item.id, property: property.uri })
    },

    onDoubleClick: (event) => {
      this.props.onDoubleClick(event)
    }
  })

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



  render() {
    const { item, cache, width, hasCoverImage, ...props } = this.props

    delete props.onClick
    delete props.onDoubleClick

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}
        onClick={this.handleClick}>

        {hasCoverImage && <CoverImage item={item} size={24} cache={cache}/>}

        <Editable {...props}
          value={this.value}
          onChange={this.handleChange}/>
      </td>
    )
  }


  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isSelected: PropTypes.bool,

    hasCoverImage: PropTypes.bool,

    property: PropTypes.shape({
      uri: PropTypes.string.isRequired,
      type: PropTypes.string,
    }),

    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      cover: PropTypes.number,
      data: PropTypes.object.isRequired,
      photos: PropTypes.array
    }).isRequired,

    cache: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,

    onClick: PropTypes.func,
    onSingleClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }
}


module.exports = {
  TableCell
}
