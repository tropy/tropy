'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ListNode } = require('./node')
const { get, move } = require('../../common/util')


class ListTree extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      order: get(props, 'parent.children') || []
    }
  }

  get order() {
    return get(this.props, 'parent.children') || []
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


  handleSortPreview = (item, to, offset = 0) => {
    this.setState({
      order: move(this.state.order, item, to, offset)
    })
  }

  handleSortReset = () => {
    this.setState({ order: this.order })
  }

  handleSort = () => {
    const { parent, onSort } = this.props
    onSort({ id: parent.id, children: this.state.order })
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
    const { lists, onListSave, onListItemsAdd, ...props } = this.props

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
              onDropItems={onListItemsAdd}
              onSave={onListSave}
              onSortPreview={this.handleSortPreview}
              onSortReset={this.handleSortReset}
              onSort={this.handleSort}/>)
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
    onListItemsAdd: PropTypes.func,
    onListSave: PropTypes.func,
    onSort: PropTypes.func,
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  ListTree
}
