'use strict'

const React = require('react')
const { PureComponent } = React
const { ListNode } = require('./node')
const { get, move } = require('../../common/util')
const { arrayOf, func, number, object, shape } = require('prop-types')


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
    return get(this.props.edit, 'id') === id
  }

  isSelected(id) {
    return this.props.selection === id
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
    const list = this.props.edit

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
              isSortable
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
    parent: shape({
      id: number.isRequired,
      children: arrayOf(number).isRequired
    }).isRequired,
    lists: object.isRequired,
    edit: object,
    selection: number,
    onClick: func.isRequired,
    onEditCancel: func.isRequired,
    onDropFiles: func.isRequired,
    onDropItems: func.isRequired,
    onListSave: func.isRequired,
    onSort: func.isRequired,
    onContextMenu: func.isRequired
  }
}

module.exports = {
  ListTree
}
