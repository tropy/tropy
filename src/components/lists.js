'use strict'

const React = require('react')

const { PropTypes } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { root } = require('../selectors/list')
const { save } = require('../actions/list')


const Lists = ({ lists, onListChange }) => (
  <ol className="lists">
    {
      lists.map(list => (
        <li className="list"
          key={list.id}>
          <IconFolder/>
          <Editable
            value={list.name}
            enabled={!list.name}
            onChange={onListChange}/>
        </li>))
    }
  </ol>
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
