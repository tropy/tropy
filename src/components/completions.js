'use strict'

const React = require('react')
const { Component } = React
const { Popup } = require('./popup')
const { OptionList } = require('./option')
const { blank } = require('../common/util')
const { bounds, viewport } = require('../dom')
const { startsWith } = require('../collate')
const { INPUT, POPUP } = require('../constants/sass')
const {
  array, bool, func, instanceOf, number, shape, string
} = require('prop-types')


class Completions extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentWillReceiveProps(props) {
    if (this.props !== props) {
      this.setState(this.getStateFromProps(props))
    }
  }

  getStateFromProps(props = this.props) {
    return {
      active: props.selection[0],
      options: this.filter(props)
    }
  }

  getPopupBounds() {
    const { parent, maxRows, padding } = this.props
    if (parent == null) return

    const { top, bottom, left, width } = bounds(parent)
    const rows = this.state.options.length

    const height = OptionList.getHeight(rows, { maxRows }) + padding.height
    const anchor = (bottom + height <= viewport().height) ? 'top' : 'bottom'

    return {
      anchor,
      top: (anchor === 'top') ? bottom : top - height,
      left,
      height,
      width: width + padding.width
    }
  }

  get isBlank() {
    return this.state.options.length === 0
  }

  get isVisible() {
    return (this.props.isVisibleWhenBlank || !this.isBlank) &&
      this.props.minQueryLength <= this.props.query.length
  }

  filter({ completions, match, query, toId, toText } = this.props) {
    query = query.trim().toLowerCase()
    let matchAll = blank(query)
    let options = []
    options.idx = {}

    completions.forEach((value, idx) => {
      if (matchAll || match(value, query)) {
        let id = toId(value)
        options.idx[id] = options.length
        options.push({ id, idx, value: toText(value) })
      }
    })

    return options
  }

  select() {
    let idx = this.state.options.idx[this.state.active]
    let active = this.props.completions[idx]
    if (active != null) this.props.onSelect(active)
  }

  next(k = 1) {
    let next = (this.ol != null) ? this.ol.next(k) : null
    if (next != null) this.handleActivate(next, true)
  }

  prev(k = 1) {
    let prev = (this.ol != null) ? this.ol.prev(k) : null
    if (prev != null) this.handleActivate(prev, true)
  }

  handleActivate = ({ id }, scrollIntoView) => {
    this.setState({ active: id })
    if (scrollIntoView) this.ol.scrollIntoView({ id }, false)
  }

  handleSelect = (option) => {
    this.props.onSelect(this.props.completions[option.idx])
  }

  handleResize = () => {
    this.forceUpdate()
  }

  setOptionList = (ol) => {
    this.ol = ol
  }

  render() {
    if (!this.isVisible) return null
    const { anchor, ...style } = this.getPopupBounds()

    return (
      <Popup
        anchor={anchor}
        className={this.props.className}
        style={style}
        onResize={this.handleResize}>
        <OptionList
          active={this.state.active}
          onActivate={this.handleActivate}
          onSelect={this.handleSelect}
          ref={this.setOptionList}
          selection={this.props.selection}
          values={this.state.options}/>
      </Popup>
    )
  }

  static propTypes = {
    className: string,
    completions: array.isRequired,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    maxRows: number.isRequired,
    minQueryLength: number.isRequired,
    onSelect: func.isRequired,
    padding: shape({
      height: number.isRequired,
      width: number.isRequired
    }).isRequired,
    parent: instanceOf(HTMLElement).isRequired,
    query: string.isRequired,
    selection: array.isRequired,
    toId: func.isRequired,
    toText: func.isRequired,
  }

  static defaultProps = {
    match: (value, query) => startsWith(value.name || String(value), query),
    maxRows: 10,
    minQueryLength: 0,
    padding: {
      height: POPUP.PADDING + INPUT.FOCUS_SHADOW_WIDTH + INPUT.BORDER_WIDTH,
      width: 2 * INPUT.FOCUS_SHADOW_WIDTH
    },
    selection: [],
    toId: (value) => (value.id || String(value)),
    toText: (value) => (value.name || String(value))
  }
}

module.exports = {
  Completions
}
