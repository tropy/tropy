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
      active: null,
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

  filter({ completions, match, option, query } = this.props) {
    query = query.trim().toLowerCase()
    const matchAll = blank(query)

    // TODO add options.idx for cached look-ups!

    return completions.reduce((options, value, idx) => {
      if (matchAll || match(value, query)) {
        options.push({ ...option(value), idx })
      }
      return options
    }, [])
  }

  next = () => {
    const next = (this.ol != null) ? this.ol.next() : null
    if (next != null) this.handleActivate(next, true)
  }

  prev = () => {
    const prev = (this.ol != null) ? this.ol.prev() : null
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
    option: func.isRequired,
    onSelect: func.isRequired,
    padding: shape({
      height: number.isRequired,
      width: number.isRequired
    }).isRequired,
    parent: instanceOf(HTMLElement).isRequired,
    query: string.isRequired,
    selection: array
  }

  static defaultProps = {
    match: startsWith,
    maxRows: 10,
    minQueryLength: 0,
    option: (value) => ({ id: value, value }),
    padding: {
      height: POPUP.PADDING + INPUT.FOCUS_SHADOW_WIDTH + INPUT.BORDER_WIDTH,
      width: 2 * INPUT.FOCUS_SHADOW_WIDTH
    }
  }
}

module.exports = {
  Completions
}
