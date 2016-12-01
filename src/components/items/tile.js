'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const cn = require('classnames')


class ItemTile extends Component {

  handleClick = () => {
    const { item, isSelected, onSelect } = this.props
    onSelect(item.id, isSelected ? 'clear' : 'replace')
  }

  render() {
    const { item, cache, isSelected } = this.props

    return (
      <li
        className={cn({ 'item-tile': true, 'active': isSelected })}
        onClick={this.handleClick}>
        <CoverImage item={item} size={256} cache={cache}/>
      </li>
    )
  }

  static propTypes = {
    isSelected: PropTypes.bool,

    cache: PropTypes.string.isRequired,
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    onSelect: PropTypes.func.isRequired
  }
}

module.exports = {
  ItemTile
}
