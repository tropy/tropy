'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { arrayOf, number, shape, string } = PropTypes
const { connect } = require('react-redux')
const { getVisibleTags } = require('../../selectors')
const { IconButton } = require('../button')

const {
  IconTag,
  IconPlus,
  IconPlusCircles,
  IconMinusCircle,
  IconMinusCircles
} = require('../icons')

class TagPanel extends PureComponent {

  render() {
    return (
      <div className="tag list tab-pane">
        <ul>
          {this.props.tags.map(tag =>
            <li key={tag.id}>
              <IconTag/>
              <div className="name">{tag.name}</div>
              <IconButton icon={<IconPlusCircles/>}/>
              <IconButton icon={<IconMinusCircles/>}/>
              <IconButton icon={<IconMinusCircle/>}/>
            </li>
          )}
          <li>
            <div className="flex-row center add-tag">
              <IconPlus/>
              <FormattedMessage id="panel.tags.add"/>
            </div>
          </li>
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
