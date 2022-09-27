import React from 'react'
import { ItemPanelGroup } from './panel'
import { ItemContainer } from './container'
import { Resizable } from '../resizable'
import { NOTE, SASS } from '../../constants'
import { pick } from '../../common/util'
import debounce from 'lodash.debounce'

import {
  arrayOf, bool, func, object, number, shape
} from 'prop-types'



export class ItemView extends React.PureComponent {
  itemContainer = React.createRef()

  state = {
    note: null
  }

  static getDerivedStateFromProps(props, state) {
    if (props.note) {
      if (state.note == null)
        return { ...state, note: props.note }

      if (state.note.id) {

        // If we previously had different note, or if the new note has
        // been modified more recently than our local copy, we use the
        // props version.
        if (state.note.id !== props.note.id)
          return { ...state, note: props.note }

        if (state.note.modified < props.note.modified)
          return { ...state, note: props.note }

        // Otherwise, when updating the current note we keep the local
        // editor state in favor of the serialized state coming back
        // from the store; otherwise we lose unserializable
        // state such as the editor's undo/redo history.

      } else {

        // When our local note exists but has no id, the props version
        // may be the initially saved version of the note currently
        // in the editor. We assume this is so, if the `created`
        // timestamps match and merge the new note with our current
        // editor state.
        if (state.note.created === props.note.created)
          return {
            ...state,
            note: {
              ...props.note,
              state: state.note.state,
              text: state.note.text
            }
          }

        // Otherwise we discard the temporary note in favor of the new one.
        return { ...state, note: props.note }
      }

    } else {

      if (state.note?.id)
        return { ...state, note: null }
    }

    return null
  }

  componentDidUpdate(prevProps, { note }) {
    if (note?.id != null && note.id !== this.state.note?.id) {
      this.handleNoteRemoval(note)
    }
  }

  get offset() {
    return (this.props.isItemOpen) ?
      0 : `calc(100% - ${this.props.offset}px)`
  }

  get style() {
    return { transform: `translate3d(${this.offset}, 0, 0)` }
  }

  focusNotePad = () => {
    this.itemContainer.current?.notepad.current?.focus()
  }

  handleNoteCreate = () => {
    let delay = 50

    if (!this.props.isItemOpen) {
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
    }

    setTimeout(this.focusNotePad, delay)
  }

  handleNoteRemoval(note) {
    if (note.id != null && !note.text) {
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

  handleNoteChange = (note, hasChanged, isBlank) => {
    if (!this.props.isReadOnly) {
      if (note.id != null) {
        this.handleNoteSave(note, {
          blank: isBlank,
          changed: hasChanged
        })

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
    this.handleNoteSave.flush()
  }

  render() {
    const {
      keymap,
      offset,
      panel,
      photo,
      onPanelDragStop,
      onPanelResize,
      isItemOpen,
      isProjectClosing,
      isReadOnly,
      ...props
    } = this.props

    return (
      <section className="item-view" style={this.style}>
        <Resizable
          edge={isItemOpen ? 'right' : 'left'}
          value={offset}
          min={SASS.PANEL.MIN_WIDTH}
          max={SASS.PANEL.MAX_WIDTH}
          onResize={onPanelResize}
          onDragStop={onPanelDragStop}>
          <ItemPanelGroup {...pick(props, ItemPanelGroup.props)}
            panel={panel}
            photo={photo}
            note={this.state.note}
            keymap={keymap}
            isItemOpen={isItemOpen}
            isDisabled={isProjectClosing}
            isReadOnly={isReadOnly}
            onNoteCreate={this.handleNoteCreate}
            onNoteDelete={this.props.onNoteDelete}/>
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
          onPhotoConsolidate={this.props.onPhotoConsolidate}
          onPhotoCreate={this.props.onPhotoCreate}
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
    panel: object,
    activeSelection: number,
    note: object,
    photo: object,
    isItemOpen: bool.isRequired,
    isProjectClosing: bool,
    isReadOnly: bool,

    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onPhotoConsolidate: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPanelResize: func.isRequired,
    onPanelDragStop: func.isRequired,
    onUiUpdate: func.isRequired
  }
}
