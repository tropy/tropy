'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { meta } = require('../../common/os')
const cn = require('classnames')


class ItemTile extends Component {

  handleClick = (event) => {
    const { item, isSelected, onSelect } = this.props

    return onSelect(
      item.id,
      isSelected ?
        (meta(event) ? 'remove' : 'clear') :
        (meta(event) ? 'merge' : 'replace')
    )
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, this.props.item)
  }

  get style() {
    const height = `${this.props.size * 1.25}px`

    return {
      height, flexBasis: height
    }
  }

  get classes() {
    return {
      'item-tile': true,
      'active': this.props.isSelected
    }
  }

  render() {
    return (
      <li
        className={cn(this.classes)}
        style={this.style}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        <CoverImage {...this.props}/>
      </li>
    )
  }

  static propTypes = {
    size: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired,
    isSelected: PropTypes.bool,
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired
  }
}

module.exports = {
  ItemTile
}
