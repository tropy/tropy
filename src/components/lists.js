'use strict'

const React = require('react')

const { PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { root } = require('../selectors/list')
const { save } = require('../actions/list')


const Lists = ({ lists, onListChange }) => (
  <div className="lists">
    <FormattedMessage id="sidebar.lists"/>
    <br/>
    {
      lists.map(list => (
        <div key={list.id}>
          <IconFolder/>
          <Editable
            value={list.name}
            enabled={!list.name}
            onChange={onListChange}/>
        </div>))
    }
  </div>
)

Lists.propTypes = {
  lists: PropTypes.array,
  onListChange: PropTypes.func
}

module.exports = {
  Lists: connect(

    state => ({
      lists: root(state)
    }),

    dispatch => ({
      onListChange() {
        dispatch(save())
      }
    })

  )(Lists)
}
