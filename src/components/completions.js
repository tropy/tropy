'use strict'

const React = require('react')
const { Component } = React
const { Popup } = require('./popup')
const { OptionList } = require('./option')
const { array, bool, func, instanceOf, string } = require('prop-types')
const { blank } = require('../common/util')
const { bounds } = require('../dom')
const { INPUT } = require('../constants/sass')



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
    return this.props.isVisibleWhenBlank || !this.isBlank
  }

  filter({ completions, match, query } = this.props) {
    query = query.trim().toLowerCase()

    return blank(query) ?
      completions :
      completions.filter(value => match(query, value))
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
    completions: array.isRequired,
    input: instanceOf(HTMLElement).isRequired,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    onSelect: func.isRequired,
    query: string.isRequired
  }

  static defaultProps = {
    match(query, value) {
      const text = value.name.toLowerCase()
      return text !== query && text.includes(query)
    }
  }
}

module.exports = {
  Completions
}
