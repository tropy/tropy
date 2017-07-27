'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { ButtonGroup, IconButton } = require('../button')
const { FormGroup, Label } = require('../form')
const { arrayOf, bool, func, shape, string } = require('prop-types')

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
        <Label id="prefs.template.select"
          size={3}/>
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
              title="prefs.template.tools.new"
              isDisabled={this.props.isPristine}
              onClick={this.props.onClear}/>
            <IconButton
              icon={<IconCopy/>}
              title="prefs.template.tools.copy"
              isDisabled={this.props.isPristine}
              onClick={this.props.onCopy}/>
            <IconButton
              icon={<IconTrash/>}
              title="prefs.template.tools.delete"
              isDisabled={this.props.isPristine || this.props.isProtected}
              onClick={this.props.onDelete}/>
            <IconButton
              icon={<IconImport/>}
              title="prefs.template.tools.import"
              onClick={this.props.onImport}/>
            <IconButton
              icon={<IconExport/>}
              title="prefs.template.tools.export"
              isDisabled={this.props.isPristine}
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
    isPristine: bool,
    isProtected: bool,
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
