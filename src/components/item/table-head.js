'use strict'

const React = require('react')
const { PureComponent } = React
const { Resizable } = require('../resizable')
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

  get isResizable() {
    return this.props.onResize != null
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id,
      context: this.props.context
    })
  }

  handleResize = () => {
  }

  render() {
    return (
      <Resizable
        className={cx(this.classes)}
        edge="right"
        isDisabled={!this.isResizable}
        max={480}
        min={40}
        node="th"
        onResize={this.handleResize}
        value={this.props.width}>
        <div
          className="th-container"
          onClick={this.handleClick}>
          <div className="label">{this.props.label}</div>
          {this.props.isActive && <IconChevron7/>}
        </div>
      </Resizable>
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
    onClick: func.isRequired,
    onResize: func
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

  handleResize = () => {
  }

  render() {
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
                onClick={this.props.onSort}/>}
            {this.props.columns.map(({ width, property }) =>
              <ItemTableHeadCell
                context="metadata"
                key={property.id}
                id={property.id}
                label={this.getLabel(property)}
                width={width}
                isActive={this.isActive(property)}
                isAscending={this.isAscending}
                onClick={this.props.onSort}
                onResize={this.handleResize}/>)}
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
  ItemTableHead,
  BlankTableHeadCell
}
