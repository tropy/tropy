'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ListNode } = require('./node')
const { get } = require('dot-prop')


class ListTree extends Component {
  constructor(props) {
    super(props)

    this.state = {
      order: get(props, 'parent.children') || []
    }
  }

  componentWillReceiveProps(props) {
    const order = get(props, 'parent.children') || []

    if (order !== this.state.order) {
      this.setState({ order })
    }
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
      <ol className="lists">
        {
          this.state.order.map(id =>
            <ListNode {...props}
              key={id}
              list={lists[id] || { id }}
              isSelected={this.isSelected(id)}
              isEditing={this.isEditing(id)}
              isContext={this.isContext(id)}
              onSave={onListSave}/>)
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
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  ListTree
}
