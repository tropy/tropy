'use strict'

const React = require('react')
const { Panel } = require('../panel')
const { NoteToolbar } = require('./toolbar')
const { NoteList } = require('./list')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')
const cx = require('classnames')
const { has } = require('../../common/util')


class NotePanel extends Panel {
  handleContextMenu = (event) => {
    const { item, photo, onContextMenu } = this.props
    onContextMenu(event, 'notes', { item, photo })
  }

  handleOpen = (note) => {
    const { item, photo, isItemOpen, onItemOpen } = this.props

    if (note && !isItemOpen) {
      onItemOpen({
        id: item,
        photos: [photo],
        notes: [note.id],
        selection: note.selection
      })
    }
  }

  renderToolbar() {
    return (
      <NoteToolbar
        hasCreateButton
        isDisabled={this.props.isDisabled}
        notes={this.props.notes.length}
        onCreate={this.props.onCreate}/>
    )
  }

  renderContent() {
    return (
      <NoteList
        isDisabled={this.props.isDisabled}
        keymap={this.props.keymap}
        notes={this.props.notes}
        selection={this.props.selection}
        onBlur={this.handleNestedBlur}
        onTabFocus={this.handleNestedTabFocus}
        onContextMenu={this.props.onContextMenu}
        onOpen={this.handleOpen}
        onSelect={this.props.onSelect}/>
    )
  }

  render() {
    const toolbar = this.renderToolbar()
    const content = this.renderContent()
    const classes = {
      'nested-tab-focus': this.state.hasNestedTabFocus,
      'has-active': has(this.props, ['selection', 'id'])
    }

    return (
      <section
        className={cx('note-panel', 'panel', classes)}
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
    })).isRequired,
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
