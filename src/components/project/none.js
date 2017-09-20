'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { bool, func } = require('prop-types')
const cx = require('classnames')


class NoProject extends PureComponent {
  get classes() {
    return ['no-project', {
      over: this.props.isOver && this.props.canDrop
    }]
  }

  renderToolbar() {
    return this.props.showToolbar && (
      <Toolbar onDoubleClick={this.props.onToolbarDoubleClick}/>
    )
  }

  render() {
    return this.props.connect(
      <div className={cx(this.classes)}>
        {this.renderToolbar()}
        <figure className="no-project-illustration"/>
        <h1>
          <FormattedMessage
            id="project.none"
            values={{
              newProject: (
                <a onClick={this.props.onProjectCreate}>
                  <FormattedMessage id="project.new"/>
                </a>
              )
            }}/>
        </h1>
      </div>
    )
  }


  static propTypes = {
    canDrop: bool,
    isOver: bool,
    showToolbar: bool.isRequired,
    connect: func.isRequired,
    onProjectCreate: func.isRequired,
    onToolbarDoubleClick: func
  }

  static defaultProps = {
    showToolbar: ARGS.frameless
  }
}

module.exports = {
  NoProject
}
