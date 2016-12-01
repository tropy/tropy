'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconMaze } = require('../icons')
const { Editable } = require('../editable')
const cn = require('classnames')

class ProjectName extends Component {

  handleClick = () => {
    if (this.props.isSelected) {
      this.props.onProjectRename()
    } else {
      this.props.onSelect()
    }
  }

  render() {
    const { name, isSelected, context, ...props } = this.props

    delete props.onProjectRename

    return (
      <ol>
        <li
          className={cn({ active: isSelected, context })}
          onClick={this.handleClick}>
          <IconMaze/>
          <div className="title project-title">
            <Editable {...props} value={name} isRequired/>
          </div>
        </li>
      </ol>
    )
  }

  static propTypes = {
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,

    context: PropTypes.bool,

    name: PropTypes.string.isRequired,

    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,

    onProjectRename: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }
}

module.exports = {
  ProjectName
}
