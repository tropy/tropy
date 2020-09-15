import React from 'react'
import { bool, func, object, string } from 'prop-types'
import { FormattedMessage, injectIntl } from 'react-intl'
import { Step } from '../steps'
import { Button } from '../button'
import { FormElement, FormGroup } from '../form'
import cx from 'classnames'


const ProjectName = injectIntl(class extends React.Component {
  get isBlank() {
    return !this.props.value
  }

  get placeholder() {
    return this.props.intl.formatMessage({ id: 'wizard.project.name' })
  }

  handleChange = (event) => {
    this.props.onChange(event.target.value)
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        if (!this.isBlank) this.props.onChange('')
        break
      case 'Enter':
        if (!this.isBlank) this.props.onCommit()
        break
      default:
        return
    }

    event.stopPropagation()
  }

  render() {
    return (
      <FormElement isCompact>
        <input
          className="form-control input-lg"
          value={this.props.value}
          type="text"
          autoFocus
          placeholder={this.placeholder}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}/>
      </FormElement>
    )
  }

  static propTypes = {
    intl: object.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    value: string.isRequired
  }
})


const ProjectFile = ({ value, isCustom, onClick }) => (
  <FormGroup className={cx('save-as', { custom: isCustom })}>
    <div className="save-as-link-container">
      <a
        className="save-as-link"
        onClick={onClick}>
        <FormattedMessage id="wizard.project.save_as"/>
      </a>
    </div>
    <div className="save-as-controls">
      <input
        className="form-control input-lg"
        readOnly
        type="text"
        value={value}/>
      <Button
        isDefault
        size="lg"
        text="wizard.project.change"
        onClick={onClick}/>
    </div>
  </FormGroup>
)

ProjectFile.propTypes = {
  onClick: func.isRequired,
  isCustom: bool,
  value: string.isRequired
}

export const ProjectStep = (props) => (
  <Step>
    <div className="tropy-icon"/>
    <h1><FormattedMessage id="wizard.project.title"/></h1>
    <ProjectName
      value={props.name}
      onChange={props.onNameChange}
      onCommit={props.onComplete}/>
    <ProjectFile
      value={props.file}
      isCustom={!props.hasDefaultFilename}
      onClick={props.onFileSelect}/>
    <Button
      isBlock
      isDisabled={!props.file}
      isPrimary
      onClick={props.onComplete}
      size="lg"
      text="wizard.project.submit"/>
  </Step>
)

ProjectStep.propTypes = {
  base: string,
  hasDefaultFilename: bool,
  name: string.isRequired,
  file: string.isRequired,
  onBaseChange: func.isRequired,
  onNameChange: func.isRequired,
  onFileSelect: func.isRequired,
  onComplete: func.isRequired
}
