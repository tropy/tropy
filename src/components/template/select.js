import { useIntl } from 'react-intl'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Select } from '../select.js'
import * as collate from '../../collate.js'
import { selectTemplatesByType } from '../../selectors/ontology.js'

export const TemplateSelect = ({
  isMixed,
  tabIndex = -1,
  type,
  match = (tpl, query) => (collate.match(tpl.name, query, /\b\w/g)),
  ...props
}) => {
  let intl = useIntl()
  let placeholder = (props.placeholder) ?
      intl.formatMessage({ id: props.placeholder }) : null

  let options = useSelector(state =>
    selectTemplatesByType(state, { type }))

  return (
    <Select
      {...props}
      className={cx('template-select', { mixed: isMixed })}
      match={match}
      placeholder={placeholder}
      tabIndex={tabIndex}
      options={options}/>
  )
}
