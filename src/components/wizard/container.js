import React from 'react'
import { func, shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { Steps } from '../steps'
import { Titlebar } from '../toolbar'
import { ProjectStep } from './project'
import { join } from 'path'
import actions from '../../actions'
import sanitize from 'sanitize-filename'
import { blank } from '../../common/util'
import { existsSync as exists } from 'fs'


class Wizard extends React.PureComponent {
  get hasDefaultFilename() {
    return this.props.project.file === this.getDefaultFilename()
  }

  getDefaultFilename(name = this.props.project.name, count = 0) {
    if (blank(name)) return ''

    const file = join(
      this.props.userData,
      sanitize(`${name}${count > 0 ? count : ''}.tpy`))

    return exists(file) ?
      this.getDefaultFilename(name, count + 1) :
      file
  }

  handleComplete = () => {
    this.props.onComplete(this.props.project, { truncate: true })
  }

  handleNameChange = (name) => {
    this.props.onProjectUpdate({
      name,
      file: this.getDefaultFilename(name)
    })
  }

  handleBaseChange = ({ base }) => {
    this.props.onProjectUpdate({ base: base ? 'project' : null })
  }

  handleFileSelect = () => {
    this.props.onProjectSaveAs(
      this.props.project.file || this.props.userData
    )
  }

  render() {
    return (
      <div className="wizard">
        <Titlebar isOptional/>
        <Steps>
          <ProjectStep {...this.props.project}
            hasDefaultFilename={this.hasDefaultFilename}
            onBaseChange={this.handleBaseChange}
            onNameChange={this.handleNameChange}
            onFileSelect={this.handleFileSelect}
            onComplete={this.handleComplete}/>
        </Steps>
      </div>
    )
  }

  static propTypes = {
    project: shape({
      base: string,
      file: string.isRequired,
      name: string.isRequired
    }).isRequired,
    userData: string.isRequired,
    onComplete: func.isRequired,
    onProjectSaveAs: func.isRequired,
    onProjectUpdate: func.isRequired
  }
}


const WizardContainer = connect(
  ({ wizard }) => ({
    project: wizard.project,
    userData: wizard.userData
  }),

  (dispatch) => ({
    onProjectUpdate(...args) {
      dispatch(actions.wizard.project.update(...args))
    },

    onProjectSaveAs(...args) {
      dispatch(actions.wizard.project.save(...args))
    },

    onComplete(...args) {
      dispatch(actions.wizard.complete(...args))
    }
  })
)(Wizard)

export {
  WizardContainer
}
