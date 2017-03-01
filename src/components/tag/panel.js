'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, number, shape, string } = PropTypes
const { connect } = require('react-redux')
const { getVisibleTags } = require('../../selectors')


class TagPanel extends PureComponent {

  render() {
    return (
      <div className="tag tab-pane">
        <ul>
          {this.props.tags.map(tag => <li key={tag.id}>{tag.name}</li>)}
        </ul>
      </div>
    )
  }

  static propTypes = {
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired
  }
}

module.exports = {
  TagPanel: connect(
    (state) => ({
      tags: getVisibleTags(state)
    })
  )(TagPanel)
}
