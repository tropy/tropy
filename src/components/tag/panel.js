'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, number, shape, string } = PropTypes
const { connect } = require('react-redux')
const { getItemTags } = require('../../selectors')
const { TagList } = require('./list')

const noop = () => {}

class TagPanel extends PureComponent {

  render() {
    return (
      <div className="tag list tab-pane">
        <TagList
          tags={this.props.tags}
          onEditCancel={noop}
          onSave={noop}
          onContextMenu={noop}/>

        <div className="add-tag-container">
          <input
            type="text"
            className="form-control add-tag"
            tabIndex={-1}
            placeholder="Add tags"/>
        </div>
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
      tags: getItemTags(state)
    })
  )(TagPanel)
}
