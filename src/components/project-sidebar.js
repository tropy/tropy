'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { Component, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('./toolbar')
const { IconLibrary, IconTag } = require('./icons')
const { Editable } = require('./editable')
const { ActivityPane } = require('./activity')
const { Lists } = require('./lists')
const { Sidebar } = require('./sidebar')
const { save } = require('../actions/project')
const { update } = require('../actions/nav')
const context = require('../actions/context')
const cn = require('classnames')

class ProjectName extends Component {
  static propTypes = {
    active: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }

  select = () => {
    if (!this.props.active) {
      this.props.onSelect()
    }
  }

  render() {
    const { active, name, onChange } = this.props

    return (
      <ol>
        <li className={cn({ active })} onClick={this.select}>
          <IconLibrary/>
          <div className="title project-title">
            <Editable
              value={name}
              required
              onChange={onChange}/>
          </div>
        </li>
      </ol>
    )
  }
}

const ProjectSidebar = ({
  project,
  active,
  onSelect,
  onChange,
  toolbar,
  showListsMenu
}) => (
  <Sidebar>
    { toolbar ? <Toolbar draggable/> : undefined }
    <div className="sidebar-body">
      <section>
        <nav>
          <ProjectName
            name={project.name}
            active={active}
            onChange={onChange}
            onSelect={onSelect}/>
        </nav>
      </section>
      <section onContextMenu={showListsMenu}>
        <h2><FormattedMessage id="sidebar.lists"/></h2>
        <nav>
          <Lists/>
        </nav>
      </section>
      <section>
        <h2>Tags</h2>
        <nav>
          <ol>
            <li>
              <IconTag/>
              <div className="title">Betrayal</div>
            </li>
          </ol>
        </nav>
      </section>
    </div>
    <ActivityPane/>
  </Sidebar>
)

ProjectSidebar.propTypes = {
  active: PropTypes.bool,
  toolbar: PropTypes.bool,
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func,
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
      onChange(name) {
        dispatch(save({ name }))
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
