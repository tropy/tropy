'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconMaze } = require('../icons')
const { Editable } = require('../editable')
const cn = require('classnames')

class ProjectName extends Component {

  select = () => {
    if (!this.props.active) this.props.onSelect()
  }

  render() {
    const { active, context } = this.props

    return (
      <ol>
        <li className={cn({ active, context })} onClick={this.select}>
          <IconMaze/>
          <div className="title project-title">
            <Editable
              value={this.props.name}
              isRequired
              isEditing={this.props.isEditing}
              onActivate={this.props.onEditStart}
              onChange={this.props.onChange}
              onCancel={this.props.onEditCancel}/>
          </div>
        </li>
      </ol>
    )
  }

  static propTypes = {
    isEditing: PropTypes.bool,

    active: PropTypes.bool,
    context: PropTypes.bool,

    name: PropTypes.string.isRequired,

    onChange: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired,
    onEditStart: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }
}

module.exports = {
  ProjectName
}
