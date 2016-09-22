'use strict'

const React = require('react')

const { connect } = require('react-redux')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('./toolbar')
const { IconLibrary } = require('./icons')
const { Editable } = require('./editable')
const { Lists } = require('./lists')
const { Sidebar } = require('./sidebar')
const { persist } = require('../actions/project')

const ProjectSidebar = ({
  project,
  onProjectChange,
}) => (
  <Sidebar>
    <Toolbar draggable/>
    <section>
      <nav>
        <ol>
          <li>
            <IconLibrary/>
            <div className="title project-title">
              <Editable
                value={project.name}
                onChange={onProjectChange}/>
            </div>
          </li>
        </ol>
      </nav>
    </section>
    <section>
      <h2><FormattedMessage id="sidebar.lists"/></h2>
      <nav>
        <Lists parent={0}/>
        <Lists parent={0} tmp/>
      </nav>
    </section>
    <section>
      <h2>Tags</h2>
      <nav></nav>
    </section>
  </Sidebar>
)

ProjectSidebar.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onProjectChange: PropTypes.func
}

module.exports = {
  ProjectSidebar: connect(
    state => ({
      project: state.project
    }),

    dispatch => ({
      onProjectChange(name) {
        dispatch(persist({ name }))
      }
    })
  )(ProjectSidebar)
}
