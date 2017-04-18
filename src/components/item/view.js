'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { arrayOf, bool, func, object, number, shape, string } = PropTypes
const { ItemPanel } = require('./panel')
const { Resizable, BufferedResizable } = require('../resizable')
const { EsperImage } = require('../esper')
const { NotePad } = require('../note')
const { PROJECT: { MODE }, SASS: { PANEL } } = require('../../constants')
const { pick } = require('../../common/util')
const debounce = require('lodash.debounce')

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

      if (note.id && note.id === props.note.id) {
        return
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

  handleEsperResize = (height) => {
    this.props.onUiUpdate({ esper: { height } })
  }


  handleNoteCreate = () => {
    let delay = 50

    if (!this.isItemOpen) {
      delay = 1000
      this.props.onItemOpen({
        id: this.props.items[0].id, photos: [this.props.photo.id]
      })
    }

    if (this.props.note) {
      this.props.onNoteSelect({ photo: this.props.photo.id, note: null })
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

          this.props.onNoteCreate(note)
        }
      }
    }

    this.setState({ note })
  }


  render() {
    const {
      esper,
      keymap,
      offset,
      panel,
      photo,
      onPanelResize,
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
          onResize={onPanelResize}
          onDragStop={onPanelDragStop}>
          <ItemPanel {...pick(props, ItemPanel.props)}
            panel={panel}
            photo={photo}
            note={this.state.note}
            isItemOpen={isItemOpen}
            isDisabled={isTrashSelected}
            onNoteCreate={this.handleNoteCreate}/>
        </Resizable>

        <div className="item-container">
          <BufferedResizable
            edge="bottom"
            value={esper.height}
            isRelative
            onChange={this.handleEsperResize}
            min={256}>
            <EsperImage isVisible photo={photo}/>
          </BufferedResizable>
          <NotePad
            ref={this.setNotePad}
            note={this.state.note}
            isDisabled={isTrashSelected || !photo}
            isItemOpen={isItemOpen}
            keymap={keymap.NotePad}
            onChange={this.handleNoteChange}/>
        </div>
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

    esper: shape({
      height: number.isRequired
    }).isRequired,

    keymap: object.isRequired,
    offset: number.isRequired,
    mode: string.isRequired,
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
