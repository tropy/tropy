import React from 'react'
import { ItemPanelGroup } from './panel'
import { ItemContainer } from './container'
import { Resizable } from '../resizable'
import { NOTE, PROJECT, SASS } from '../../constants'
import { pick } from '../../common/util'
import debounce from 'lodash.debounce'

const { MODE } = PROJECT

import {
  arrayOf, bool, func, object, number, shape, string
} from 'prop-types'


function getNoteTemplate() {
  return { text: '' }
}


export class ItemView extends React.PureComponent {
  itemContainer = React.createRef()

  state = {
    note: this.props.note || getNoteTemplate()
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.note !== this.props.note) {
      if (props.note == null)
        this.handleNoteReset()
      else
        this.handleNoteUpdate(props.note)
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

  focusNotePad = () => {
    this.itemContainer.current?.notepad.current?.focus()
  }

  handlePanelResize = ({ value }) => {
    this.props.onPanelResize(value)
  }


  handleNoteCreate = () => {
    let delay = 50

    if (!this.isItemOpen) {
      delay += 800
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

    setTimeout(this.focusNotePad, delay)
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
    if (!this.props.isReadOnly) {
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
      onPanelDragStop,
      isProjectClosing,
      isReadOnly,
      ...props
    } = this.props

    const { isItemOpen } = this

    return (
      <section className="item-view" style={this.style}>
        <Resizable
          edge={isItemOpen ? 'right' : 'left'}
          value={offset}
          min={SASS.PANEL.MIN_WIDTH}
          max={SASS.PANEL.MAX_WIDTH}
          onResize={this.handlePanelResize}
          onDragStop={onPanelDragStop}>
          <ItemPanelGroup {...pick(props, ItemPanelGroup.props)}
            panel={panel}
            photo={photo}
            note={this.state.note}
            keymap={keymap}
            isItemOpen={isItemOpen}
            isDisabled={isProjectClosing}
            isReadOnly={isReadOnly}
            onNoteCreate={this.handleNoteCreate}/>
        </Resizable>
        <ItemContainer
          ref={this.itemContainer}
          note={this.state.note}
          photo={photo}
          isDisabled={!isItemOpen || isProjectClosing}
          isReadOnly={isReadOnly}
          onContextMenu={this.props.onContextMenu}
          onNoteChange={this.handleNoteChange}
          onNoteCommit={this.handleNoteCommit}
          onPhotoCreate={this.props.onPhotoCreate}
          onPhotoError={this.props.onPhotoError}
          onPhotoSave={this.props.onPhotoSave}
          onPhotoSelect={this.props.onPhotoSelect}
          onUiUpdate={this.props.onUiUpdate}/>
      </section>
    )
  }


  static propTypes = {
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
    panel: object,
    activeSelection: number,
    note: object,
    photo: object,
    isModeChanging: bool.isRequired,
    isProjectClosing: bool,
    isReadOnly: bool,

    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPanelResize: func.isRequired,
    onPanelDragStop: func.isRequired,
    onUiUpdate: func.isRequired
  }
}
