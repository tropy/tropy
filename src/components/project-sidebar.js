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
const { update } = require('../actions/nav')
const context = require('../actions/context')
const cn = require('classnames')

const ProjectSidebar = ({
  project,
  active,
  onSelect,
  onProjectChange,
  showListsMenu
}) => (
  <Sidebar>
    <Toolbar draggable/>
    <section>
      <nav>
        <ol>
          <li className={cn({ active })} onClick={onSelect}>
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
    <section onContextMenu={showListsMenu}>
      <h2><FormattedMessage id="sidebar.lists"/></h2>
      <nav>
        <Lists parent={0}/>
        <Lists parent={0} tmp/>
      </nav>
    </section>
    <section>
      <h2>Tags</h2>
    </section>
  </Sidebar>
)

ProjectSidebar.propTypes = {
  active: PropTypes.bool,
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onProjectChange: PropTypes.func,
  onSelect: PropTypes.func,
  showListsMenu: PropTypes.func
}

module.exports = {
  ProjectSidebar: connect(
    state => ({
      project: state.project,
      active: !state.nav.list
    }),

    dispatch => ({
      onProjectChange(name) {
        dispatch(persist({ name }))
      },

      onSelect() {
        dispatch(update({ list: undefined }))
      },

      showListsMenu(event) {
        event.stopPropagation()
        dispatch(context.show(event, 'lists'))
      }
    })
  )(ProjectSidebar)
}
