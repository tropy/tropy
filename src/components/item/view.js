'use strict'

const React = require('react')
const { PureComponent } = React
const { ItemPanel } = require('./panel')
const { ItemContainer } = require('./container')
const { Resizable } = require('../resizable')
const { PROJECT: { MODE }, SASS: { PANEL } } = require('../../constants')
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

      if (!props.note) {
        this.handleNoteUpdate.flush()
        return this.setState({ note: getNoteTemplate() })
      }

      const { note } = this.state

      if (!note.id && note.created && note.created === props.note.created) {
        return this.setState({ note: { ...note, id: props.note.id } })
      }

      this.handleNoteUpdate.flush()
      this.setState({ note: props.note })
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


  setNotePad = (notepad) => {
    this.notepad = notepad
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

    setTimeout(this.notepad.focus, delay)
  }

  handleNoteUpdate = debounce(note => {
    if (note.text.length) {
      this.props.onNoteSave(note)
    }
  }, 5000)

  handleNoteChange = (note, hasDocChanged) => {
    if (hasDocChanged && note.text.length) {
      if (note.id) {
        this.handleNoteUpdate(note)

      } else {
        if (!note.created) {
          note.created = Date.now()
          note.photo = this.props.photo.id
          note.selection = this.props.activeSelection

          this.props.onNoteCreate(note)
        }
      }
    }

    this.setState({ note })
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
          note={this.state.note}
          photo={photo}
          isDisabled={isTrashSelected}
          isOpen={isItemOpen}
          onNoteChange={this.handleNoteChange}
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
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
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
