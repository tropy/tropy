'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { ButtonGroup, IconButton } = require('../button')
const { FormGroup, Label } = require('../form')
const { arrayOf, func, shape, string } = require('prop-types')

const {
  IconNew,
  IconCopy,
  IconTrash,
  IconImport,
  IconExport,
} = require('../icons')


class TemplateToolbar extends PureComponent {
  handleExport = () => {
    this.props.onExport({
      id: this.props.selected
    })
  }

  render() {
    return (
      <FormGroup className="select-template">
        <Label id="prefs.template.select"/>
        <div className="col-9 flex-row center">
          <TemplateSelect
            templates={this.props.templates}
            selected={this.props.selected}
            isRequired={false}
            placeholder="prefs.template.new"
            onChange={this.props.onChange}/>
          <ButtonGroup>
            <IconButton
              icon={<IconNew/>}
              isDisabled={!this.props.selected}
              onClick={this.props.onClear}/>
            <IconButton
              icon={<IconCopy/>}
              isDisabled={!this.props.selected}
              onClick={this.props.onCopy}/>
            <IconButton
              icon={<IconTrash/>}
              isDisabled={!this.props.selected}
              onClick={this.props.onDelete}/>
            <IconButton
              icon={<IconImport/>}
              onClick={this.props.onImport}/>
            <IconButton
              icon={<IconExport/>}
              isDisabled={!this.props.selected}
              onClick={this.handleExport}/>
          </ButtonGroup>
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    templates: arrayOf(shape({
      id: string.isRequired,
      name: string
    })).isRequired,
    selected: string,
    onChange: func.isRequired,
    onClear: func.isRequired,
    onCopy: func.isRequired,
    onDelete: func.isRequired,
    onExport: func.isRequired,
    onImport: func.isRequired
  }
}

module.exports = {
  TemplateToolbar
}
