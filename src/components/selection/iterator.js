import React from 'react'
import { DND, DropTarget } from '../dnd'
import { arrayOf, bool, func, number, shape, string } from 'prop-types'
import { adjacent, move } from '../../common/util'


export class SelectionIterator extends React.Component {
  get isSortable() {
    return !this.props.isDisabled && this.size > 1
  }

  isActive(selection) {
    return this.props.active === selection
  }

  handleDropSelection = ({ id, to, offset }) => {
    const { onSort, photo } = this.props
    const order = move(photo.selections, id, to, offset)
    onSort({ photo: photo.id, selections: order })
  }

  handleLoadError = () => {
    this.props.onError(this.props.photo.id)
  }

  select = (selection) => {
    if (selection != null && !this.isActive(selection)) {
      this.props.onSelect({
        id: this.props.photo.id,
        item: this.props.photo.item,
        selection: selection.id,
        notes: selection.notes
      })
    }
  }

  open = (selection) => {
    if (selection != null) {
      this.props.onItemOpen({
        id: this.props.photo.id,
        item: this.props.photo.item,
        selection: selection.id
      })
    }
  }

  connect(element) {
    return this.isSortable ? this.props.dropTarget(element) : element
  }

  getAdjacent = (selection) => {
    return adjacent(this.props.selections, selection).map(s => s.id)
  }

  map(fn) {
    const { isSortable } = this

    return this.props.selections.map((selection, index) => {
      return fn({
        selection,
        cache: this.props.cache,
        getAdjacent: this.getAdjacent,
        isActive: this.isActive(selection.id),
        isDisabled: this.props.isDisabled,
        isItemOpen: this.props.isItemOpen,
        isLast: index === this.props.selections.length - 1,
        isSortable,
        isVertical: !(this.props.cols > 1),
        photo: this.props.photo,
        onContextMenu: this.props.onContextMenu,
        onDropSelection: this.handleDropSelection,
        onError: this.handleLoadError,
        onItemOpen: this.open,
        onSelect: this.select
      })
    })
  }

  static propTypes = {
    active: number,
    dropTarget: func,
    isDisabled: bool.isRequired,
    isItemOpen: bool,
    isOver: bool,
    cols: number,
    photo: shape({
      id: number.isRequired
    }).isRequired,
    selections: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    cache: string.isRequired,
    onContextMenu: func.isRequired,
    onError: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired
  }

  static asDropTarget() {
    return DropTarget(DND.SELECTION, DropTargetSpec, DropTargetCollect)(this)
  }
}


const DropTargetSpec = {
  canDrop({ photo }, monitor) {
    const selection = monitor.getItem()
    return photo.id === selection.photo
  },

  drop({ photo }, monitor) {
    if (monitor.didDrop()) return

    const { id } = monitor.getItem()
    const { selections } = photo
    const to = selections[selections.length - 1]

    if (id !== to) {
      return { id, to, offset: 1 }
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dropTarget: connect.dropTarget(),
  isOver: monitor.isOver({ shallow: true })
})
