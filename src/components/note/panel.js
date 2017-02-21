'use strict'

const React = require('react')
const { Panel } = require('../panel')
const { NoteToolbar } = require('./toolbar')
const { NoteList } = require('./list')
const { arrayOf, shape, number, bool, func } = React.PropTypes


class NotePanel extends Panel {

  handleCreate = () => {
    const { item, photo, onCreate } = this.props
    onCreate({ item, photo })
  }

  handleContextMenu = (event) => {
    const { item, photo, onContextMenu } = this.props
    onContextMenu(event, 'notes', { item, photo })
  }

  handleOpen = (note) => {
    const { item, photo, isItemOpen, onItemOpen } = this.props

    if (!isItemOpen) {
      onItemOpen({
        id: item, photos: [photo], notes: [note.id]
      })
    }
  }

  renderToolbar() {
    const { isDisabled } = this.props

    return (
      <NoteToolbar
        hasCreateButton={!isDisabled}
        onCreate={this.handleCreate}/>
    )
  }

  renderContent() {
    const {
      notes,
      selection,
      onContextMenu,
      onSelect
    } = this.props

    return (
      <NoteList
        notes={notes}
        selection={selection}
        onContextMenu={onContextMenu}
        onOpen={this.handleOpen}
        onSelect={onSelect}/>
    )
  }

  render() {
    const toolbar = this.renderToolbar()
    const content = this.renderContent()

    return (
      <section
        className="note-panel panel"
        onContextMenu={this.handleContextMenu}>
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

    item: number,
    photo: number,
    selection: number,

    onItemOpen: func.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onSelect: func.isRequired
  }
}

module.exports = {
  NotePanel
}
