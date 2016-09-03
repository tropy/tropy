'use strict'

const React = require('react')

const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { IconFolder } = require('./icons')
const { Editable } = require('./editable')
const { Sidebar } = require('./sidebar')
const { persist } = require('../actions/project')
const { root } = require('../selectors/list')

const ProjectSidebar = ({
  project,
  lists,
  onProjectChange,
  onListChange
}) => (
  <Sidebar>
    <Toolbar draggable/>

    <h1>
      <Editable
        value={project.name}
        onChange={onProjectChange}/>
    </h1>

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
  </Sidebar>
)

ProjectSidebar.propTypes = {
  lists: PropTypes.array,
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onProjectChange: PropTypes.func,
  onListChange: PropTypes.func
}

ProjectSidebar.defaultProps = {
  lists: []
}

module.exports = {
  ProjectSidebar: connect(
    state => ({
      project: state.project,
      lists: root(state)
    }),

    dispatch => ({
      onProjectChange(name) {
        dispatch(persist({ name }))
      },

      onListChange() {
      }
    })
  )(ProjectSidebar)
}
