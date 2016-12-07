'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const cn = require('classnames')


class ItemTile extends Component {

  get isSelected() {
    return this.props.selection.includes(this.props.item.id)
  }

  handleClick = () => {
    const { item, onSelect } = this.props
    onSelect(item.id, this.isSelected ? 'clear' : 'replace')
  }

  // DRY (see ItemTableRow)
  handleContextMenu = (event) => {
    const { item, selection, onSelect, onContextMenu } = this.props

    const context = ['item']
    const target = { id: item.id, tags: item.tags }

    if (this.isSelected) {
      if (selection.length > 1) {
        context.push('bulk')
        target.id = selection
      }

    } else {
      onSelect(item.id, 'replace')
    }

    if (item.deleted) context.push('deleted')

    onContextMenu(event, context.join('-'), target)
  }

  get style() {
    const height = `${this.props.size * 1.25}px`

    return {
      height, flexBasis: height
    }
  }

  render() {
    return (
      <li
        className={cn({ 'item-tile': true, 'active': this.isSelected })}
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
    selection: PropTypes.arrayOf(PropTypes.number),
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
