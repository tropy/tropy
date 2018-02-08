'use strict'

const React = require('react')
const { PureComponent } = React
const { Resizable } = require('../resizable')
const cx = require('classnames')
const { getLabel } = require('../../common/ontology')
const { IconChevron7 } = require('../icons')
const { NAV, TYPE } = require('../../constants')
const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const MIN_WIDTH = 40
const MIN_WIDTH_MAIN = 100

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
    return this.props.onResize != null && this.props.position != null
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id
    })
  }

  handleDragStop = () => {
    this.props.onResize({
      column: this.props.position,
      width: this.props.width
    }, true)
  }

  handleResize = ({ value }) => {
    this.props.onResize({
      column: this.props.position,
      width: value
    }, false)
  }

  render() {
    return (
      <Resizable
        className={cx(this.classes)}
        edge="right"
        isDisabled={!this.isResizable}
        max={this.props.maxWidth}
        min={this.props.minWidth}
        node="th"
        onDragStop={this.handleDragStop}
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
    isActive: bool,
    isAscending: bool.isRequired,
    label: string.isRequired,
    maxWidth: number,
    minWidth: number.isRequired,
    position: number,
    type: string.isRequired,
    id: string.isRequired,
    width: number.isRequired,
    onClick: func.isRequired,
    onResize: func
  }

  static defaultProps = {
    minWidth: MIN_WIDTH,
    type: TYPE.TEXT
  }
}


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
    return (
      <table className="table-head">
        <thead>
          <tr>
            {this.props.hasPositionColumn &&
              <ItemTableHeadCell
                {...NAV.COLUMN.POSITION}
                isActive={this.isActive(NAV.COLUMN.POSITION)}
                isAscending={this.isAscending}
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
                onClick={this.props.onSort}
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
    onResize: func.isRequired,
    onSort: func.isRequired
  }
}

module.exports = {
  ItemTableHead,
  BlankTableHeadCell
}
