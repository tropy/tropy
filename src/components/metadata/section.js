'use strict'

const React = require('react')
const { TemplateSelect } = require('../template/select')
const { MetadataHeader } = require('./header')
const { noop } = require('../../common/util')
const { array, bool, func, node, number, string } = require('prop-types')

const MetadataSection = (props) => {
  let hasTemplates = !!props.templates
  return (
    <section onContextMenu={props.onContextMenu}>
      <MetadataHeader
        count={{ count: props.count }}
        onChange={props.onTypeChange}
        options={props.options}
        separator={!hasTemplates}
        title={props.title}
        value={props.type}/>
      {hasTemplates &&
        <TemplateSelect
          isDisabled={props.isDisabled}
          isMixed={props.isMixed}
          isRequired
          options={props.templates}
          value={props.template}
          onChange={props.onTemplateChange}/>}
      {props.children}
    </section>
  )
}

MetadataSection.propTypes = {
  children: node.isRequired,
  isDisabled: bool,
  isMixed: bool,
  count: number,
  options: array,
  onContextMenu: func,
  onTemplateChange: func.isRequired,
  onTypeChange: func.isRequired,
  template: string,
  templates: array,
  title: string.isRequired,
  type: string
}

MetadataSection.propTypes = {
  onTemplateChange: noop,
  onTypeChange: noop
}

module.exports = {
  MetadataSection
}
