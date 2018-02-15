'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget } = require('react-dnd')
const { arrayOf, bool, func, number, shape, string } = require('prop-types')
const { DND } = require('../../constants')
const { move } = require('../../common/util')


class SelectionIterator extends Iterator {
  get classes() {
    return {
      'drop-target': this.isSortable,
      'over': this.props.isOver,
      [this.orientation]: true
    }
  }

  get isSortable() {
    return !this.props.isDisabled && this.size > 1
  }

  isActive(selection) {
    return this.props.active === selection
  }

  getIterables(props = this.props) {
    return props.selections || super.getIterables()
  }

  head() {
    return this.props.active
  }

  handleDropSelection = ({ id, to, offset }) => {
    const { onSort, photo } = this.props
    const order = move(photo.selections, id, to, offset)
    onSort({ photo: photo.id, selections: order })
  }

  select = (selection) => {
    if (selection != null && !this.props.isActive) {
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

  map(fn) {
    const { isSortable, isVertical } = this

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
        isVertical,
        photo: this.props.photo,
        onContextMenu: this.props.onContextMenu,
        onDropSelection: this.handleDropSelection,
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
    photo: shape({
      id: number.isRequired
    }).isRequired,
    selections: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    cache: string.isRequired,
    size: number.isRequired,
    onContextMenu: func.isRequired,
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


module.exports = {
  SelectionIterator
}
