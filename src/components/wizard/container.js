'use strict'

const React = require('react')
const { PureComponent } = React
const { func, shape, string } = require('prop-types')
const { connect } = require('react-redux')
const { Steps } = require('../steps')
const { Toolbar } = require('../toolbar')
const { ProjectStep } = require('./project')
const { join } = require('path')
const actions = require('../../actions')
const sanitize = require('sanitize-filename')


class WizardContainer extends PureComponent {
  get hasDefaultFilename() {
    return this.props.project.file === this.getDefaultFilename()
  }

  getDefaultFilename(name = this.props.project.name) {
    return name ? join(this.props.userData, sanitize(`${name}.tpy`)) : ''
  }

  handleProjectComplete = () => {
    this.props.onComplete(this.props.project, { truncate: true })
  }

  handleProjectChange = (name) => {
    this.props.onProjectUpdate({
      name,
      file: this.getDefaultFilename(name)
    })
  }

  handleProjectSave = () => {
    this.props.onProjectSave(
      this.props.project.file || this.props.userData
    )
  }

  render() {
    return (
      <div className="wizard">
        <Toolbar/>
        <Steps>
          <ProjectStep {...this.props.project}
            hasDefaultFilename={this.hasDefaultFilename}
            onNameChange={this.handleProjectChange}
            onFileChange={this.handleProjectSave}
            onComplete={this.handleProjectComplete}/>
        </Steps>
      </div>
    )
  }

  static propTypes = {
    project: shape({
      name: string.isRequired,
      file: string.isRequired
    }).isRequired,
    userData: string.isRequired,
    onComplete: func.isRequired,
    onProjectSave: func.isRequired,
    onProjectUpdate: func.isRequired
  }
}


module.exports = {
  WizardContainer: connect(
    ({ wizard }) => ({
      project: wizard.project,
      userData: wizard.userData
    }),

    (dispatch) => ({
      onProjectUpdate(...args) {
        dispatch(actions.wizard.project.update(...args))
      },

      onProjectSave(...args) {
        dispatch(actions.wizard.project.save(...args))
      },

      onComplete(...args) {
        dispatch(actions.wizard.complete(...args))
      }
    })
  )(WizardContainer)
}
