'use strict'

const React = require('react')
const { Component } = React
const { Popup } = require('./popup')
const { OptionList } = require('./option')
const { blank } = require('../common/util')
const { bounds } = require('../dom')
const { startsWith } = require('../collate')
const { INPUT } = require('../constants/sass')
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
      completions: this.filter(props)
    }
  }

  getPopupStyle() {
    const { input } = this.props
    if (!input) return

    const { completions } = this.state
    const { bottom, left, width } = bounds(input)

    return {
      left,
      top: bottom,
      width: width - 2 * INPUT.BORDER_WIDTH,
      height: OptionList.getHeight(completions.length)
    }
  }

  get isBlank() {
    return this.state.completions.length === 0
  }

  get isVisible() {
    return (this.props.isVisibleWhenBlank || !this.isBlank) &&
      this.props.minQueryLength <= this.props.query.length
  }

  filter({ completions, match, query } = this.props) {
    query = query.trim().toLowerCase()

    return blank(query) ?
      completions :
      completions.filter(value => match(value, query))
  }

  render() {
    return this.isVisible && (
      <Popup
        anchor="top"
        className={this.props.className}
        style={this.getPopupStyle()}>
        <OptionList
          onSelect={this.props.onSelect}
          values={this.state.completions}/>
      </Popup>
    )
  }

  static propTypes = {
    className: string,
    completions: arrayOf(string).isRequired,
    input: instanceOf(HTMLElement).isRequired,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    minQueryLength: number.isRequired,
    onSelect: func.isRequired,
    query: string.isRequired
  }

  static defaultProps = {
    match: startsWith,
    minQueryLength: 0
  }
}

module.exports = {
  Completions
}
