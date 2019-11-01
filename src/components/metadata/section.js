'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { TemplateSelect } = require('../template/select')
const { ResourceSelect } = require('../resource/select')
const { noop } = require('../../common/util')
const cx = require('classnames')
const { array, bool, func, node, number, string } = require('prop-types')

const MetadataSection = (props) => {
  let hasTemplates = !!props.templates
  return (
    <section onContextMenu={props.onContextMenu}>
      <h5 className={cx('metadata-heading', {
        separator: !hasTemplates
      })}>
        <FormattedMessage
          id={props.title}
          values={{ count: props.count }}/>
      </h5>
      {hasTemplates &&
        <TemplateSelect
          isDisabled={props.isDisabled}
          isMixed={props.isMixed}
          isRequired
          options={props.templates}
          value={props.template}
          onChange={props.onTemplateChange}/>}
      <ResourceSelect
        canClearByBackspace={false}
        hideClearButton
        isRequired
        options={props.options}/>
      {props.children}
    </section>
  )
}

MetadataSection.propTypes = {
  children: node.isRequired,
  isDisabled: bool,
  isMixed: bool,
  count: number,
  onContextMenu: func,
  onTemplateChange: func.isRequired,
  template: string,
  templates: array,
  options: array,
  title: string.isRequired
}

MetadataSection.propTypes = {
  onTemplateChange: noop
}

module.exports = {
  MetadataSection
}
