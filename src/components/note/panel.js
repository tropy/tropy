'use strict'

const React = require('react')
const { Panel } = require('../panel')
const { NoteToolbar } = require('./toolbar')
const { NoteList } = require('./list')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')


class NotePanel extends Panel {

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
    const { isDisabled, onCreate } = this.props

    return (
      <NoteToolbar
        hasCreateButton={!isDisabled}
        onCreate={onCreate}/>
    )
  }

  renderContent() {
    return (
      <NoteList
        keymap={this.props.keymap}
        notes={this.props.notes}
        selection={this.props.selection}
        onContextMenu={this.props.onContextMenu}
        onOpen={this.handleOpen}
        onSelect={this.props.onSelect}/>
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
    keymap: object.isRequired,
    notes: arrayOf(shape({
      id: number.isRequired
    })),
    photo: number,
    selection: object,
    onItemOpen: func.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onSelect: func.isRequired
  }
}

module.exports = {
  NotePanel
}
