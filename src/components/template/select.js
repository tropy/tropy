import React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { ResourceSelect } from '../resource/select.js'
import { Select } from '../select.js'
import { match } from '../../collate.js'
import { selectTemplatesByType } from '../../selectors/ontology.js'


export const TemplateSelect = React.forwardRef(({
  isMixed,
  type,
  ...props
}, ref) => {
  let options = useSelector(state =>
    selectTemplatesByType(state, { type }))

  return (
    <ResourceSelect
      {...props}
      className={cx('template-select', { mixed: isMixed })}
      options={options}
      ref={ref}/>
  )
})

TemplateSelect.defaultProps = {
  ...Select.defaultProps,
  match: (tpl, query) => (
    match(tpl.name, query, /\b\w/g)
  ),
  tabIndex: -1
}
