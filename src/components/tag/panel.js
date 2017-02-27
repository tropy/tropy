'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, number, shape } = PropTypes


class TagPanel extends PureComponent {

  render() {
    return (
      <ul>
        {this.props.tags.map(tag => <li key={tag.id}>{tag.name}</li>)}
      </ul>
    )
  }

  static propTypes = {
    tags: arrayOf(shape({
      id: number.isRequired
    })).isRequired
  }
}

module.exports = {
  TagPanel
}
