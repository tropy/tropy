'use strict'

const React = require('react')
const { PureComponent } = React
const { NAV } = require('../../constants')
const { arrayOf, bool, number, object } = require('prop-types')
const { BlankTableHeadCell } = require('./table-head-cell')

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
            <SpacerCell width={NAV.COLUMN.POSITION.width}/>}
          {this.props.columns.map(({ property }, idx) =>
            <SpacerCell key={property.id} width={this.props.colwidth[idx]}/>)}
          <BlankTableHeadCell/>
        </tr>
      </thead>
    )
  }

  static propTypes = {
    columns: arrayOf(object).isRequired,
    colwidth: arrayOf(number).isRequired,
    hasPositionColumn: bool
  }
}

module.exports = {
  ItemTableSpacer
}
