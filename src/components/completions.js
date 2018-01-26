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
  arrayOf, bool, func, instanceOf, number, string
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
    if (this.props.input == null) return

    const { top, bottom, left, width } = bounds(this.props.input)
    const rows = this.state.options.length

    const height = OptionList.getHeight(rows, this.props.maxRows) + PAD.height
    const anchor = (bottom + height <= viewport().height) ? 'top' : 'bottom'

    return {
      anchor,
      top: (anchor === 'top') ? bottom : top - height,
      left,
      height,
      width: width + PAD.width
    }
  }

  get isBlank() {
    return this.state.options.length === 0
  }

  get isVisible() {
    return (this.props.isVisibleWhenBlank || !this.isBlank) &&
      this.props.minQueryLength <= this.props.query.length
  }

  filter({ completions, match, query } = this.props) {
    query = query.trim().toLowerCase()
    const matchAll = blank(query)

    // TODO add options.idx for cached look-ups!

    return completions.reduce((options, value) => {
      if (matchAll || match(value, query)) {
        options.push({ id: value, value })
      }

      return options
    }, [])
  }

  next = () => {
    const next = (this.ol != null) ? this.ol.next() : null
    if (next != null) this.handleActivate(next.id, null, true)
  }

  prev = () => {
    const prev = (this.ol != null) ? this.ol.prev() : null
    if (prev != null) this.handleActivate(prev.id, null, true)
  }

  handleActivate = (id, _, scrollIntoView) => {
    this.setState({ active: id })
    if (scrollIntoView) this.ol.scrollIntoView({ id }, false)
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
          ref={this.setOptionList}
          onHover={this.handleActivate}
          onSelect={this.props.onSelect}
          selection={this.state.active}
          values={this.state.options}/>
      </Popup>
    )
  }

  static propTypes = {
    className: string,
    completions: arrayOf(string).isRequired,
    input: instanceOf(HTMLElement).isRequired,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    maxRows: number.isRequired,
    minQueryLength: number.isRequired,
    onSelect: func.isRequired,
    query: string.isRequired
  }

  static defaultProps = {
    match: startsWith,
    maxRows: 10,
    minQueryLength: 0
  }
}

const PAD = {
  height: POPUP.PADDING
    + INPUT.FOCUS_SHADOW_WIDTH
    + INPUT.BORDER_WIDTH,
  width: 2 * INPUT.FOCUS_SHADOW_WIDTH
}


module.exports = {
  Completions
}
