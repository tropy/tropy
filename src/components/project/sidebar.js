'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { Component, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { ActivityPane } = require('../activity')
const { ListTree, TrashListNode } = require('../list')
const { TagList } = require('../tag')
const { Sidebar } = require('../sidebar')
const { ProjectName } = require('./name')
const { ROOT } = require('../../constants/list')
const { has } = require('dot-prop')
const { getAllVisibleTags } = require('../../selectors/tag')
const act = require('../../actions')


class ProjectSidebar extends Component {

  showSidebarMenu = (event) => {
    this.props.onContextMenu(event, 'sidebar')
  }

  showProjectMenu = (event) => {
    this.props.onContextMenu(
      event, 'project', { path: this.props.project.file }
    )
  }

  showListsMenu = (event) => {
    this.props.onContextMenu(event, 'lists')
  }

  showTagsMenu = (event) => {
    this.props.onContextMenu(event, 'tags')
  }

  render() {
    const {
      project, tags, hasToolbar, isTrashSelected,
      onItemsDelete, onContextMenu, ...props
    } = this.props

    return (
      <Sidebar>
        {hasToolbar && <Toolbar draggable/>}

        <div
          className="sidebar-body"
          onContextMenu={this.showSidebarMenu}>
          <section onContextMenu={this.showProjectMenu}>
            <nav>
              <ProjectName {...props} name={project.name}/>
            </nav>
          </section>

          <section onContextMenu={this.showListsMenu}>
            <h2><FormattedMessage id="sidebar.lists"/></h2>
            <nav>
              <ListTree {...props} parent={ROOT}/>
            </nav>
          </section>

          <section>
            <nav>
              <ol>
                <TrashListNode
                  isSelected={isTrashSelected}
                  onSelect={this.props.onSelect}
                  onContextMenu={onContextMenu}
                  onDropItems={onItemsDelete}/>
              </ol>
            </nav>
          </section>

          <section onContextMenu={this.showTagsMenu}>
            <h2><FormattedMessage id="sidebar.tags"/></h2>
            <nav>
              <TagList tags={tags} onContextMenu={onContextMenu}/>
            </nav>
          </section>
        </div>

        <ActivityPane/>

      </Sidebar>
    )
  }

  static propTypes = {
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,
    isTrashSelected: PropTypes.bool,

    hasToolbar: PropTypes.bool,

    context: PropTypes.bool,

    project: PropTypes.shape({
      file: PropTypes.string,
      name: PropTypes.string
    }).isRequired,

    tags: PropTypes.arrayOf(PropTypes.object),

    onRename: PropTypes.func,
    onSelect: PropTypes.func,
    onEditCancel: PropTypes.func,
    onChange: PropTypes.func,
    onContextMenu: PropTypes.func,
    onItemsDelete: PropTypes.func
  }
}



module.exports = {
  ProjectSidebar: connect(
    (state) => ({
      isEditing: has(state.ui.edit, 'project.name'),
      isSelected: !state.nav.list && !state.nav.trash,
      isTrashSelected: state.nav.trash,
      context: has(state.ui.context, 'project'),
      project: state.project,
      tags: getAllVisibleTags(state)
    }),

    (dispatch) => ({
      onRename() {
        dispatch(act.ui.edit.start({ project: { name: true } }))
      },

      onSelect(opts) {
        dispatch(act.nav.select({ list: null, trash: null, ...opts }))
      },

      onChange(name) {
        dispatch(act.project.save({ name }))
        dispatch(act.ui.edit.cancel())
      }
    })
  )(ProjectSidebar)
}
