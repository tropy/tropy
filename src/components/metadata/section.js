import React from 'react'
import { FormattedMessage } from 'react-intl'
import { TemplateSelect } from '../template/select'
import { noop } from '../../common/util'
import cx from 'classnames'
import { array, bool, func, node, number, string } from 'prop-types'

export const MetadataSection = (props) => {
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
  title: string.isRequired
}

MetadataSection.defaultProps = {
  onTemplateChange: noop
}
