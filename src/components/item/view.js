'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ItemPanel } = require('./panel')
const { Resizable, BufferedResizable } = require('../resizable')
const { EsperImage } = require('../esper')
const { NotePad } = require('../note')
const { PROJECT: { MODE }, SASS: { PANEL } } = require('../../constants')
const { get, pick } = require('../../common/util')

const {
  arrayOf, bool, func, object, number, shape, string
} = PropTypes


class ItemView extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      note: props.note || this.getNoteTemplate()
    }
  }

  componentWillReceiveProps(props) {
    if (props.note !== this.props.note) {
      this.setState({
        note: props.note || this.getNoteTemplate()
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

  getNoteTemplate() {
    return { id: -1, photo: -1, text: '' }
  }

  setNotePad = (notepad) => {
    this.notepad = notepad
  }

  handleEsperResize = (height) => {
    this.props.onUiUpdate({ esper: { height } })
  }

  handleNoteCreate = () => {
    if (this.isItemOpen) {
      return this.notepad.focus()
    }

    this.props.onItemOpen({
      id: this.item.id, photos: [this.props.photo.id]
    })

    setTimeout(this.notepad.focus, 1000)
  }

  handleNoteChange = (note) => {
    this.setState({
      note: { ...this.state.note, ...note }
    })
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
