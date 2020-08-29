import React from 'react'
import { TableHeadCell } from './head-cell'
import { titlecase } from '../../../common/util'
import { NAV } from '../../../constants'
import { arrayOf, bool, func, number, shape, string } from 'prop-types'


export class TableHead extends React.PureComponent {
  get isAscending() {
    return this.props.sort.asc
  }

  isActive({ id }) {
    return (id === this.props.sort.column)
  }

  isDragging(idx) {
    return idx === this.props.drag
  }

  isMoving(idx) {
    return (idx >= this.props.drop && idx < this.props.drag) ||
      (idx <= this.props.drop && idx > this.props.drag)
  }

  render() {
    let isFixedColumn = 1 >= this.props.columns.length

    return (
      <div
        className="table-head"
        onContextMenu={this.props.onContextMenu}>
        {this.props.hasPositionColumn &&
          <TableHeadCell
            {...NAV.COLUMN.POSITION}
            isActive={this.isActive(NAV.COLUMN.POSITION)}
            isAscending={this.isAscending}
            isFixedColumn
            onClick={this.props.onSort}/>}
        {this.props.columns.map((col, idx) =>
          <TableHeadCell
            key={col.id}
            id={col.id}
            position={idx}
            label={col.label || titlecase(col.name || col.id)}
            width={this.props.colwidth[idx]}
            minWidth={this.props[idx === 0 ? 'minWidthMain' : 'minWidth']}
            isActive={this.isActive(col)}
            isAscending={this.isAscending}
            isDragging={this.isDragging(idx)}
            isMoving={this.isMoving(idx)}
            isFixedColumn={isFixedColumn}
            onClick={this.props.onSort}
            onOrder={this.props.onOrder}
            onOrderReset={this.props.onOrderReset}
            onOrderStart={this.props.onOrderStart}
            onOrderStop={this.props.onOrderStop}
            onResize={this.props.onResize}/>)}
      </div>
    )
  }

  static propTypes = {
    columns: arrayOf(shape({
      id: string.isRequired,
      label: string,
      name: string,
      width: number.isRequired
    })).isRequired,
    colwidth: arrayOf(number).isRequired,
    drag: number,
    hasPositionColumn: bool,
    sort: shape({
      asc: bool.isRequired,
      column: string.isRequired
    }).isRequired,
    drop: number,
    minWidth: number.isRequired,
    minWidthMain: number.isRequired,
    onContextMenu: func,
    onOrder: func.isRequired,
    onOrderReset: func.isRequired,
    onOrderStart: func.isRequired,
    onOrderStop: func.isRequired,
    onResize: func.isRequired,
    onSort: func.isRequired
  }

  static defaultProps = {
    minWidth: 40,
    minWidthMain: 100
  }
}
