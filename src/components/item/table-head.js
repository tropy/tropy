'use strict'

const React = require('react')
const { PureComponent } = React
const { BlankTableHeadCell, ItemTableHeadCell } = require('./table-head-cell')
const { getLabel } = require('../../common/ontology')
const { NAV } = require('../../constants')
const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const MIN_WIDTH = 40
const MIN_WIDTH_MAIN = 100


class ItemTableHead extends PureComponent {
  get isAscending() {
    return this.props.sort.asc
  }

  isActive({ id }) {
    return (id === this.props.sort.column)
  }

  getLabel(property) {
    return property.label || getLabel(property.id)
  }

  render() {
    const isFixedColumn = 1 >= this.props.columns.length

    return (
      <table className="table-head">
        <thead>
          <tr>
            {this.props.hasPositionColumn &&
              <ItemTableHeadCell
                {...NAV.COLUMN.POSITION}
                isActive={this.isActive(NAV.COLUMN.POSITION)}
                isAscending={this.isAscending}
                isFixedColumn
                onClick={this.props.onSort}/>}
            {this.props.columns.map(({ property }, idx) =>
              <ItemTableHeadCell
                key={property.id}
                id={property.id}
                position={idx}
                label={this.getLabel(property)}
                width={this.props.colwidth[idx]}
                minWidth={idx === 0 ? MIN_WIDTH_MAIN : MIN_WIDTH}
                isActive={this.isActive(property)}
                isAscending={this.isAscending}
                isFixedColumn={isFixedColumn}
                onClick={this.props.onSort}
                onOrder={this.props.onOrder}
                onOrderReset={this.props.onOrderReset}
                onOrderStart={this.props.onOrderStart}
                onOrderStop={this.props.onOrderStop}
                onResize={this.props.onResize}/>)}
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
    colwidth: arrayOf(number).isRequired,
    hasPositionColumn: bool,
    sort: shape({
      asc: bool.isRequired,
      column: string.isRequired,
    }).isRequired,
    onOrder: func.isRequired,
    onOrderReset: func.isRequired,
    onOrderStart: func.isRequired,
    onOrderStop: func.isRequired,
    onResize: func.isRequired,
    onSort: func.isRequired
  }
}

module.exports = {
  ItemTableHead
}
