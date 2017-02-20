'use strict'

const React = require('react')
const { Panel } = require('../panel')
const { NoteToolbar } = require('./toolbar')
const { NoteList } = require('./list')
const { arrayOf, shape, number, bool, func } = React.PropTypes


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
    const { notes, selection, onContextMenu, onSave, onSelect } = this.props

    return (
      <NoteList
        notes={notes}
        selection={selection}
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

    notes: arrayOf(shape({
      id: number.isRequired
    })),

    selection: number,

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
