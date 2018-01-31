'use strict'

const React = require('react')
const { PureComponent } = React
const { COLUMNS: { PositionColumn } } = require('../../constants')
const { arrayOf, bool, number, object } = require('prop-types')
const { BlankTableHeadCell } = require('./table-head')

const SpacerCell = ({ width }) => (
  <th className="spacer" style={{ width }}/>
)

SpacerCell.propTypes = {
  width: number.isRequired
}


class ItemTableSpacer extends PureComponent {
  render() {
    return (
      <thead className="table-spacer">
        <tr>
          {this.props.hasPositionColumn &&
            <SpacerCell width={PositionColumn.width}/>}
          {this.props.columns.map(({ property, width }) =>
            <SpacerCell key={property.id} width={width}/>)}
          <BlankTableHeadCell/>
        </tr>
      </thead>
    )
  }

  static propTypes = {
    columns: arrayOf(object).isRequired,
    hasPositionColumn: bool
  }
}

module.exports = {
  ItemTableSpacer
}
