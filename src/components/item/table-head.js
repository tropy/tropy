'use strict'

const React = require('react')
const { PureComponent } = React
const cx = require('classnames')
const { getLabel } = require('../../common/ontology')
const { IconChevron7 } = require('../icons')
const { COLUMNS: { PositionColumn }, TYPE } = require('../../constants')
const {
  arrayOf, bool, func, number, object, oneOf, shape, string
} = require('prop-types')

const BlankTableHeadCell = () => (
  <th className="blank"/>
)

class ItemTableHeadCell extends PureComponent {
  get classes() {
    return ['metadata-head', this.props.type, {
      [this.direction]: this.props.isActive
    }]
  }

  get direction() {
    return this.props.isAscending ? 'ascending' : 'descending'
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id,
      context: this.props.context
    })
  }

  render() {
    const { label, isActive, width } = this.props

    return (
      <th
        style={{ width }}
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
    context: string.isRequired,
    isActive: bool,
    isAscending: bool.isRequired,
    label: string.isRequired,
    type: string.isRequired,
    id: string.isRequired,
    width: number.isRequired,
    onClick: func.isRequired
  }

  static defaultProps = {
    type: TYPE.TEXT
  }
}


class ItemTableHead extends PureComponent {
  get isAscending() {
    return this.props.sort.asc
  }

  isActive({ id, context = 'metadata' }) {
    return (id === this.props.sort.column) &&
      (context === this.props.sort.context)
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
            {this.props.hasPositionColumn &&
              <ItemTableHeadCell
                context={PositionColumn.context}
                id={PositionColumn.id}
                label={PositionColumn.label}
                width={PositionColumn.width}
                isActive={this.isActive(PositionColumn)}
                isAscending={this.isAscending}
                type={PositionColumn.type}
                onClick={onSort}/>}
            {columns.map(({ width, property }) =>
              <ItemTableHeadCell
                context="metadata"
                key={property.id}
                id={property.id}
                label={this.getLabel(property)}
                width={width}
                isActive={this.isActive(property)}
                isAscending={this.isAscending}
                onClick={onSort}/>)}
            <BlankTableHeadCell/>
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
    hasPositionColumn: bool,
    sort: shape({
      asc: bool.isRequired,
      column: string.isRequired,
      context: oneOf(['metadata', 'list', 'item']).isRequired
    }).isRequired,
    onSort: func.isRequired
  }
}

module.exports = {
  ItemTableHead
}
