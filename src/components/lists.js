'use strict'

const React = require('react')

const { PropTypes } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { children } = require('../selectors/list')
const { save } = require('../actions/list')


const List = ({ list, onUpdate }) => (
  <li className="list">
    <IconFolder/>
    <Editable
      value={list.name}
      onChange={onUpdate}/>
  </li>
)

List.propTypes = {
  list: PropTypes.object,
  onUpdate: PropTypes.func
}


const Lists = ({ lists, onUpdate }) => (
  <ol className="lists">
    {
      lists.map(list =>
        <List key={list.id} list={list} onUpdate={onUpdate}/>)
    }
  </ol>
)

Lists.propTypes = {
  lists: PropTypes.array,
  parent: PropTypes.number,
  tmp: PropTypes.bool,
  onUpdate: PropTypes.func
}

module.exports = {
  Lists: connect(

    () => {
      const selector = children()

      return (state, props) => ({
        lists: selector(state, props)
      })
    },

    dispatch => ({
      onUpdate() {
        dispatch(save())
      }
    })

  )(Lists)
}
