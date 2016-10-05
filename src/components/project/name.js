'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconLibrary } = require('../icons')
const { Editable } = require('../editable')
const cn = require('classnames')

class ProjectName extends Component {

  select = () => {
    if (!this.props.active) this.props.onSelect()
  }

  render() {
    const { active } = this.props

    return (
      <ol>
        <li className={cn({ active })} onClick={this.select}>
          <IconLibrary/>
          <div className="title project-title">
            <Editable
              value={this.props.name}
              required
              editing={this.props.editing}
              onActivate={this.props.onEditStart}
              onChange={this.props.onChange}
              onCancel={this.props.onEditCancel}/>
          </div>
        </li>
      </ol>
    )
  }

  static propTypes = {
    active: PropTypes.bool,
    editing: PropTypes.bool,

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
