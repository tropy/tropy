'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { Component, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { IconTag } = require('../icons')
const { ActivityPane } = require('../activity')
const { Lists } = require('../lists')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { ROOT } = require('../../constants/list')
const { has } = require('dot-prop')
const actions = require('../../actions')


class ProjectSidebar extends Component {

  showSidebarMenu = (event) => {
    this.props.onContextMenu(event, 'sidebar')
  }

  showProjectMenu = (event) => {
    this.props.onContextMenu(
      event, 'project', this.props.project.file
    )
  }

  showListsMenu = (event) => {
    this.props.onContextMenu(event, 'lists')
  }

  render() {
    if (this.props.toolbar) {
      var toolbar = <Toolbar draggable/>
    }

    return (
      <Sidebar>
        { toolbar }

        <div
          className="sidebar-body"
          onContextMenu={this.showSidebarMenu}>
          <section onContextMenu={this.showProjectMenu}>
            <nav>
              <ProjectName
                active={this.props.active}
                context={this.props.context}
                editing={this.props.editing}
                name={this.props.project.name}
                onChange={this.props.onChange}
                onEditCancel={this.props.onEditCancel}
                onEditStart={this.props.onEditStart}
                onSelect={this.props.onSelect}/>
            </nav>
          </section>

          <section onContextMenu={this.showListsMenu}>
            <h2><FormattedMessage id="sidebar.lists"/></h2>
            <nav>
              <Lists parent={ROOT}/>
            </nav>
          </section>

          <section>
            <h2><FormattedMessage id="sidebar.tags"/></h2>
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
  }

  static propTypes = {
    active: PropTypes.bool,
    context: PropTypes.bool,
    editing: PropTypes.bool,
    toolbar: PropTypes.bool,

    project: PropTypes.shape({
      file: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    }).isRequired,

    onChange: PropTypes.func,
    onEditStart: PropTypes.func,
    onEditCancel: PropTypes.func,
    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}



module.exports = {
  ProjectSidebar: connect(
    ({ project, nav, ui }) => ({
      active: !nav.list,
      context: has(ui.context, 'project'),
      editing: has(ui.edit, 'project.name'),
      project,
    }),

    (dispatch) => ({
      onChange(name) {
        dispatch(actions.ui.edit.cancel())
        dispatch(actions.project.save({ name }))
      },

      onEditStart() {
        dispatch(actions.project.edit({ name: true }))
      },

      onEditCancel() {
        dispatch(actions.ui.edit.cancel())
      },

      onSelect() {
        dispatch(actions.nav.update({ list: null }))
      },

      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.ui.context.show(event, ...args))
      }
    })
  )(ProjectSidebar)
}
