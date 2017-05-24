'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { shape, func, string, bool, object, arrayOf, oneOf } = PropTypes
const cn = require('classnames')
const { IconChevron7 } = require('../icons')


class ItemTableHeadCell extends PureComponent {
  get classes() {
    return {
      'metadata-head': true,
      [this.props.type]: true,
      [this.direction]: this.props.isActive
    }
  }

  get style() {
    return {
      width: this.props.width
    }
  }

  get direction() {
    return this.props.isAscending ? 'ascending' : 'descending'
  }

  handleClick = () => {
    const { id, isActive, isAscending, onClick } = this.props

    onClick({
      type: 'property',
      column: id,
      asc: !isActive || !isAscending
    })
  }

  render() {
    const { label, isActive } = this.props

    return (
      <th
        style={this.style}
        className={cn(this.classes)}
        onClick={this.handleClick}>
        <div className="metadata-head-container">
          <div className="label">{label}</div>
          {isActive && <IconChevron7/>}
        </div>
      </th>
    )
  }


  static propTypes = {
    isActive: bool,
    isAscending: bool.isRequired,
    label: string.isRequired,
    type: string.isRequired,
    id: string.isRequired,
    width: string.isRequired,
    onClick: func.isRequired
  }

  static defaultProps = {
    type: 'text'
  }
}


class ItemTableHead extends PureComponent {
  get isAscending() {
    return this.props.sort.asc
  }

  isActive(id) {
    return (id === this.props.sort.column)
  }

  render() {
    const { columns, onSort } = this.props

    return (
      <table className="table-head">
        <thead>
          <tr>
            {columns.map(({ width, property }) =>
              <ItemTableHeadCell {...property}
                key={property.id}
                width={width}
                isActive={this.isActive(property.id)}
                isAscending={this.isAscending}
                onClick={onSort}/>)}
          </tr>
        </thead>
      </table>
    )
  }

  static propTypes = {
    columns: arrayOf(shape({
      property: object.isRequired,
      width: string.isRequired
    })).isRequired,

    sort: shape({
      asc: bool.isRequired,
      column: string.isRequired,
      type: oneOf(['property']).isRequired
    }).isRequired,

    onSort: func.isRequired
  }
}

module.exports = {
  ItemTableHead
}
