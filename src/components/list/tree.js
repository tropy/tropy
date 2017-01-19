'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { ListNode } = require('./node')
const { connect } = require('react-redux')
const { get } = require('dot-prop')
const act = require('../../actions')


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


  renderNewListNode() {
    const { editing, parent, onEditCancel, onListSave } = this.props

    if (!editing || editing.parent !== parent.id) return null

    return (
      <ListNode
        list={editing}
        isEditing
        onEditCancel={onEditCancel}
        onSave={onListSave}/>
    )
  }

  render() {
    const {
      lists, selected, editing, context, onListSave, ...props
    } = this.props

    return (
      <ol className="lists">
        {
          this.state.order.map(id =>
            <ListNode {...props}
              key={id}
              list={lists[id] || { id }}
              isSelected={selected === id}
              isEditing={editing && editing.id === id}
              isContext={context === id}
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

    lists: PropTypes.object,
    selected: PropTypes.number,
    context: PropTypes.number,
    editing: PropTypes.object,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,

    onListSave: PropTypes.func,
    onSelect: PropTypes.func,

    onContextMenu: PropTypes.func
  }
}

module.exports = {
  ListTree: connect(
    (state) => ({
      selected: state.nav.list,
      context: state.ui.context.list,
      editing: state.ui.edit.list,
      lists: state.lists
    })
  )(ListTree)
}
