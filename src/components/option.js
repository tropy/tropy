'use strict'

const React = require('react')
const { Component } = React
const { blank } = require('../common/util')
const { array, string } = require('prop-types')

const Option = ({ value }) => (
  <li className="option">{value}</li>
)

Option.propTypes = {
  value: string.isRequired
}

class OptionList extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentWillReceiveProps(props) {
    if (props !== this.props) {
      this.setState(this.getStateFromProps(props))
    }
  }

  getStateFromProps(props = this.props) {
    return {
      values: this.filter(props)
    }
  }

  filter({ values, query }) {
    if (blank(query)) return values
    query = query.trim().toLowerCase()
    return values.filter(value => value.name.toLowerCase().includes(query))
  }

  render() {
    return (
      <ul className="option-list">
        {this.state.values.map(({ id, name }) =>
          <Option
            key={id}
            value={name}/>)}
      </ul>
    )
  }

  static propTypes = {
    query: string,
    values: array.isRequired
  }
}

module.exports = {
  Option,
  OptionList
}
