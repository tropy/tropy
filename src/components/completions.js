'use strict'

const React = require('react')
const { Component } = React
const { FormattedMessage } = require('react-intl')
const { Popup } = require('./popup')
const { OptionList } = require('./option')
const { blank, last } = require('../common/util')
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
      active: last(props.selection),
      options: this.filter(props)
    }
  }

  getPopupBounds() {
    const { parent, maxRows, padding } = this.props
    if (parent == null) return

    const { top, bottom, left, width } = bounds(parent)
    const rows = this.state.options.length || 1

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

  get isEmpty() {
    return this.props.completions.length === 0
  }

  get isVisible() {
    return (this.props.isVisibleWhenBlank || !this.isBlank) &&
      this.props.minQueryLength <= this.props.query.length
  }

  filter({
    completions,
    isSelectionHidden,
    match,
    query,
    selection,
    toId,
    toText
  } = this.props) {
    query = query.trim().toLowerCase()
    let matchAll = blank(query)
    let options = []
    options.idx = {}

    completions.forEach((value, idx) => {
      let id = toId(value)
      let isHidden = isSelectionHidden && selection.includes(id)
      if (!isHidden && (matchAll || match(value, query))) {
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
    this.activate(this.ol && this.ol.next(k))
  }

  prev(k = 1) {
    this.activate(this.ol && this.ol.prev(k))
  }

  first() {
    this.activate(this.ol && this.ol.first())
  }

  last() {
    this.activate(this.ol && this.ol.last())
  }

  activate(option, scrollIntoView = true) {
    if (option != null) this.handleActivate(option, scrollIntoView)
  }

  handleActivate = ({ id }, scrollIntoView) => {
    this.setState({ active: id })
    if (scrollIntoView && this.ol != null) this.ol.scrollIntoView({ id }, false)
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

  renderCompletions() {
    if (this.isEmpty) return this.renderNoCompletions()
    if (this.isBlank) return this.renderNoMatches()

    return (
      <OptionList
        active={this.state.active}
        onActivate={this.handleActivate}
        onSelect={this.handleSelect}
        ref={this.setOptionList}
        selection={this.props.selection}
        values={this.state.options}/>
    )
  }

  renderNoCompletions() {
    return (
      <FormattedMessage id="completions.empty"/>
    )
  }

  renderNoMatches() {
    return (
      <div className="option no-matches">
        <FormattedMessage id="completions.noMatches"/>
      </div>
    )
  }

  render() {
    if (!this.isVisible) return null
    const content = this.renderCompletions()

    if (!this.props.popup) {
      return <div className={this.props.className}>{content}</div>
    }

    const { anchor, ...style } = this.getPopupBounds()

    return (
      <Popup
        anchor={anchor}
        className={this.props.className}
        style={style}
        onResize={this.handleResize}>
        {content}
      </Popup>
    )
  }

  static propTypes = {
    className: string,
    completions: array.isRequired,
    isSelectionHidden: bool,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    maxRows: number.isRequired,
    minQueryLength: number.isRequired,
    onSelect: func.isRequired,
    padding: shape({
      height: number.isRequired,
      width: number.isRequired
    }).isRequired,
    parent: instanceOf(HTMLElement),
    popup: bool,
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
    popup: true,
    selection: [],
    toId: (value) => (value.id || String(value)),
    toText: (value) => (value.name || String(value))
  }
}

module.exports = {
  Completions
}
