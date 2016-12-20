'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { Editable } = require('../editable')
const { clickable } = require('../util')
const cn = require('classnames')


class TableCell extends Component {
  constructor(props) {
    super(props)
    clickable(this)
  }

  changed = (value) => {
    this.props.onChange({
      [this.props.property.uri]: { value, type: this.type }
    })
  }

  handleSingleClick = () => {
    const { item, property, onSingleClick } = this.props
    onSingleClick({ id: item.id, property: property.uri })
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



  render() {
    const {
      item, cache, width, isEditing, isDisabled, onCancel, hasCoverImage
    } = this.props

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}
        onClick={this.click}>

        {hasCoverImage && <CoverImage item={item} size={24} cache={cache}/>}

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

    hasCoverImage: PropTypes.bool,

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
