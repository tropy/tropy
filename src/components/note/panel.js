'use strict'

const React = require('react')
const { Panel } = require('../panel')
const { NoteToolbar } = require('./toolbar')
const { NoteList } = require('./list')
const { bool, func } = React.PropTypes


class NotePanel extends Panel {

  handleEdit = (note) => {
    this.props.onEdit({ note })
  }

  renderToolbar() {
    const { onCreate } = this.props

    return (
      <NoteToolbar
        hasCreateButton={false}
        onCreate={onCreate}/>
    )
  }

  renderContent() {
    const { onContextMenu, onSave, onSelect } = this.props

    return (
      <NoteList
        notes={[]}
        onContextMenu={onContextMenu}
        onEdit={this.handleEdit}
        onChange={onSave}
        onSelect={onSelect}/>
    )
  }

  render() {
    const toolbar = this.renderToolbar()
    const content = this.renderContent()

    return (
      <section className="note-panel panel">
        {this.renderHeader(toolbar)}
        {this.renderBody(content)}
      </section>
    )
  }


  static propTypes = {
    isDisabled: bool,
    isItemOpen: bool,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onEdit: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired
  }
}

module.exports = {
  NotePanel
}
