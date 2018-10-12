'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { arrayOf, func, number, object, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { TagList, Tag } = require('../tag')
const { getAllTags } = require('../../selectors')
const actions = require('../../actions')

class ProjectTags extends React.PureComponent {
  get hasNewTag() {
    return this.props.edit != null && this.props.edit.id == null
  }

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'tag', {
      id: tag.id,
      color: tag.color
    })
  }

  handleDelete = (tag) => {
    this.props.onDelete(tag.id)
  }

  render() {
    return (
      <section className="project-tags">
        <h2><FormattedMessage id={this.props.title}/></h2>
        <nav>
          <TagList
            tags={this.props.tags}
            keymap={this.props.keymap}
            selection={this.props.selection}
            edit={this.props.edit}
            onCreate={this.props.onCreate}
            onDropItems={this.props.onDropItems}
            onEditCancel={this.props.onEditCancel}
            onRemove={this.handleDelete}
            onSave={this.props.onSave}
            onSelect={this.props.onSelect}
            onContextMenu={this.handleContextMenu}/>
          {this.hasNewTag &&
            <NewTag
              onChange={this.props.onCreate}
              onEditCancel={this.props.onEditCancel}
              tag={this.props.edit}/>}
        </nav>
      </section>
    )
  }

  static propTypes = {
    edit: object,
    keymap: object.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onDropItems: func.isRequired,
    onEditCancel: func.isRequired,
    onSave: func.isRequired,
    onSelect: func.isRequired,
    selection: arrayOf(number).isRequired,
    tags: arrayOf(object).isRequired,
    title: string.isRequired
  }

  static defaultProps = {
    title: 'sidebar.tags'
  }
}

const NewTag = (props) => (
  <ol className="tag-list">
    <Tag {...props} isEditing/>
  </ol>
)


module.exports.ProjectTags = connect(
  state => ({
    keymap: state.keymap.TagList,
    selection: state.nav.tags,
    tags: getAllTags(state)
  }),

  dispatch => ({
    onDelete(...args) {
      dispatch(actions.tag.delete(...args))
    },

    onSelect(...args) {
      dispatch(actions.tag.select(...args))
    }
  })
)(ProjectTags)
