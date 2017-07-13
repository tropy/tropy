'use strict'

const React = require('react')
const { PureComponent } = React
const cx = require('classnames')
const { getLabel } = require('../../common/ontology')
const { IconChevron7 } = require('../icons')
const {
  arrayOf, bool, func, number, object, oneOf, shape, string
} = require('prop-types')


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
      width: `${this.props.width}%`
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
        className={cx(this.classes)}
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
    width: number.isRequired,
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

  getLabel(property) {
    return property.label || getLabel(property.id)
  }

  render() {
    const { columns, onSort } = this.props

    return (
      <table className="table-head">
        <thead>
          <tr>
            {columns.map(({ width, property }) =>
              <ItemTableHeadCell
                key={property.id}
                id={property.id}
                label={this.getLabel(property)}
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
      width: number.isRequired
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
