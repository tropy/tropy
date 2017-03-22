'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const {
  arrayOf, bool, func, object, number, shape, string
} = PropTypes
const { ItemPanel } = require('./panel')
const { Resizable, BufferedResizable } = require('../resizable')
const { EsperImage } = require('../esper')
const { NotePad } = require('../note')
const { PROJECT: { MODE }, SASS: { PANEL } } = require('../../constants')
const { pick } = require('../../common/util')

function getNoteTemplate() {
  return { id: -Date.now(), text: '' }
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
      this.setState({
        note: props.note || getNoteTemplate()
      })
    }
  }

  get item() { // remove?
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get isDisabled() { // keep here!
    const { item } = this
    return !(item && !item.deleted)
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
        id: this.item.id, photos: [this.props.photo.id]
      })
    }

    this.setState({ note: getNoteTemplate() })

    setTimeout(this.notepad.focus, delay)
  }

  handleNoteChange = (state, hasDocChanged) => {
    const note = { ...this.state.note, state }

    if (hasDocChanged) {
      note.text = state.doc.textBetween(0, state.doc.content.size, ' ')
    }

    if (note.id < 0 && !note.pending) {
      this.props.onNoteCreate({
        state,
        text: note.text,
        photo: this.props.photo.id
      })

      note.pending = true
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
      ...props
    } = this.props

    const { isItemOpen, isDisabled } = this

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
            isDisabled={isDisabled}
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
            isDisabled={isDisabled || !photo}
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

    onNoteCreate: func.isRequired,
    onNoteSave: func.isRequired,
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
