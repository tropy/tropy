'use strict'

const React = require('react')
const { PureComponent } = React
const { ItemPanel } = require('./panel')
const { ItemContainer } = require('./container')
const { Resizable } = require('../resizable')
const { NOTE, PROJECT: { MODE }, SASS: { PANEL } } = require('../../constants')
const { pick } = require('../../common/util')
const debounce = require('lodash.debounce')

const {
  arrayOf, bool, func, object, number, shape, string
} = require('prop-types')


function getNoteTemplate() {
  return { text: '' }
}


class ItemView extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      note: props.note || getNoteTemplate()
    }
  }

  componentWillReceiveProps(props) {
    if (props.note !== this.props.note) {
      if (props.note == null) this.handleNoteReset()
      else this.handleNoteUpdate(props.note)
    }
  }

  get isItemOpen() {
    return this.props.mode === MODE.ITEM
  }

  get offset() {
    return (this.isItemOpen ^ this.props.isModeChanging) ?
      0 : `calc(100% - ${this.props.offset}px)`
  }

  get style() {
    return { transform: `translate3d(${this.offset}, 0, 0)` }
  }


  setNotePad = (container) => {
    this.notepad = container != null ?
      container.getWrappedInstance().notepad : null
  }

  handlePanelResize = ({ value }) => {
    this.props.onPanelResize(value)
  }


  handleNoteCreate = () => {
    let delay = 50

    if (!this.isItemOpen) {
      delay = 1000
      this.props.onItemOpen({
        id: this.props.items[0].id,
        photos: [this.props.photo.id],
        selection: this.props.activeSelection
      })
    }

    if (this.props.note) {
      this.props.onNoteSelect({
        photo: this.props.photo.id,
        note: null,
        selection: this.props.activeSelection
      })
    } else {
      if (this.state.note.text) {
        this.setState({ note: getNoteTemplate() })
      }
    }

    if (this.notepad != null) {
      setTimeout(this.notepad.focus, delay)
    }
  }

  handleNoteReset() {
    this.handleNoteDelete()
    this.setState({ note: getNoteTemplate() })
  }

  handleNoteUpdate(note) {
    const { id, modified, created } = this.state.note

    if (id == null) {
      // When updating a note which was saved for the first
      // time, we just merge the id.
      if (created != null && created === note.created) {
        note = { ...this.state.note, id: note.id }
      }

    } else {

      // When updating the current note we keep the current
      // editor state in favor of the serialized state coming
      // back from the store; otherwise we lose unserializable
      // state such as the editor's undo/redo history.
      if (id === note.id) {
        if (modified >= note.modified) {
          note = { ...note, state: this.state.note.state }
        }

      // When the loading a new note, check if the old note
      // should be deleted.
      } else {
        this.handleNoteDelete()
      }
    }

    this.setState({ note })
  }

  handleNoteDelete(note = this.state.note) {
    if (note.id != null && note.text.length === 0) {
      this.handleNoteSave.cancel()
      this.props.onNoteDelete({
        photo: note.photo,
        selection: note.selection,
        notes: [note.id]
      })
    } else {
      this.handleNoteSave.flush()
    }
  }

  handleNoteSave = debounce((note, meta) => {
    this.props.onNoteSave(note, meta)
  }, NOTE.AUTOSAVE_DELAY)

  handleNoteChange = (note, changed, isBlank) => {
    if (note.id != null) {
      note.modified = new Date()
      if (isBlank) this.handleNoteSave.cancel()
      else this.handleNoteSave(note, { changed })

    } else {
      if (note.created == null && !isBlank) {
        note.created = Date.now()
        note.photo = this.props.photo.id
        note.selection = this.props.activeSelection
        this.props.onNoteCreate(note)
      }
    }

    this.setState({ note })
  }

  handleNoteCommit = () => {
    this.handleNoteDelete()
  }


  render() {
    const {
      keymap,
      offset,
      panel,
      photo,
      selections,
      onPanelDragStop,
      isTrashSelected,
      ...props
    } = this.props

    const { isItemOpen } = this

    return (
      <section className="item view" style={this.style}>
        <Resizable
          edge={isItemOpen ? 'right' : 'left'}
          value={offset}
          min={PANEL.MIN_WIDTH}
          max={PANEL.MAX_WIDTH}
          onResize={this.handlePanelResize}
          onDragStop={onPanelDragStop}>
          <ItemPanel {...pick(props, ItemPanel.props)}
            panel={panel}
            photo={photo}
            note={this.state.note}
            keymap={keymap}
            selections={selections}
            isItemOpen={isItemOpen}
            isDisabled={isTrashSelected}
            onNoteCreate={this.handleNoteCreate}/>
        </Resizable>
        <ItemContainer
          ref={this.setNotePad}
          note={this.state.note}
          photo={photo}
          isDisabled={isTrashSelected}
          isOpen={isItemOpen}
          onNoteChange={this.handleNoteChange}
          onNoteCommit={this.handleNoteCommit}
          onPhotoError={this.props.onPhotoError}
          onUiUpdate={this.props.onUiUpdate}/>
      </section>
    )
  }


  static propTypes = {
    ...ItemPanel.propTypes,

    items: arrayOf(
      shape({
        id: number.isRequired,
        tags: arrayOf(number),
        deleted: bool
      })
    ),

    keymap: object.isRequired,
    offset: number.isRequired,
    mode: string.isRequired,
    selections: object.isRequired,
    isModeChanging: bool.isRequired,
    isTrashSelected: bool.isRequired,

    onNoteCreate: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onPhotoError: func.isRequired,
    onPanelResize: func.isRequired,
    onPanelDragStop: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

delete ItemView.propTypes.isDisabled
delete ItemView.propTypes.isItemOpen


module.exports = {
  ItemView
}
