'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ListNode } = require('./node')
const { get } = require('dot-prop')
const { move } = require('../../common/util')


class ListTree extends Component {
  constructor(props) {
    super(props)

    this.state = {
      order: get(props, 'parent.children') || []
    }
  }

  componentWillReceiveProps(props) {
    this.setState({
      order: get(props, 'parent.children') || []
    })
  }

  isEditing(id) {
    return get(this.props, 'ui.edit.list.id') === id
  }

  isContext(id) {
    return get(this.props, 'ui.context.list') === id
  }

  isSelected(id) {
    return get(this.props, 'nav.list') === id
  }

  handleMove = (node, to, offset = 0) => {
    const order = this.state.order

    this.setState({
      order: move(order, node, to, offset)
    })
  }

  handleMoveReset = () => {
    this.setState({
      order: get(this.props, 'parent.children') || []
    })
  }

  handleMoveCommit = () => {
    const { onSort } = this.props
    if (onSort) onSort(this.state.order)
  }

  renderNewListNode() {
    const { parent, onEditCancel, onListSave } = this.props
    const list = get(this.props, 'ui.edit.list')

    if (!list || list.parent !== parent.id) return null

    return (
      <ListNode
        list={list}
        isEditing
        onEditCancel={onEditCancel}
        onSave={onListSave}/>
    )
  }

  render() {
    const { lists, onListSave, ...props } = this.props

    return (
      <ol className="list-tree sortable" ref={this.setContainer}>
        {
          this.state.order.map(id =>
            <ListNode {...props}
              key={id}
              list={lists[id] || { id }}
              isSelected={this.isSelected(id)}
              isEditing={this.isEditing(id)}
              isContext={this.isContext(id)}
              isSortable
              onSave={onListSave}
              onMove={this.handleMove}
              onMoveReset={this.handleMoveReset}
              onMoveCommit={this.handleMoveCommit}/>)
        }
        {this.renderNewListNode()}
      </ol>
    )
  }

  static propTypes = {
    parent: PropTypes.shape({
      id: PropTypes.number.isRequired,
      children: PropTypes.arrayOf(PropTypes.number).isRequired
    }),

    lists: PropTypes.object.isRequired,
    ui: PropTypes.object,
    nav: PropTypes.object,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onListSave: PropTypes.func,
    onSort: PropTypes.func,
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  ListTree
}
