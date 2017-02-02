'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconMaze } = require('../icons')
const { Editable } = require('../editable')
const cn = require('classnames')

class ProjectName extends Component {

  handleClick = () => {
    const { isSelected, onEdit, onSelect } = this.props

    isSelected ?
      onEdit({ project: { name: true } }) :
      onSelect({ list: null, trash: null })
  }

  render() {
    const { name, isSelected, isContext, onEditCancel, ...props } = this.props

    delete props.onEdit

    return (
      <li
        className={cn({
          'project-name': true, 'active': isSelected, 'context': isContext
        })}
        onClick={this.handleClick}>
        <IconMaze/>
        <div className="name">
          <Editable
            {...props}
            value={name}
            isRequired
            onCancel={onEditCancel}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    isContext: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,

    name: PropTypes.string.isRequired,

    onEdit: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }
}

module.exports = {
  ProjectName
}
