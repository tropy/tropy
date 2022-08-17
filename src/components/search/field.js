import React, { useRef } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, number, string } from 'prop-types'
import { useEvent } from '../../hooks/use-event.js'
import { useDebounce } from '../../hooks/use-debounce.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { IconSearch, IconXSmall } from '../icons.js'
import { Button } from '../button.js'
import { Input } from '../input.js'
import { TABS } from '../../constants/index.js'
import { blank } from '../../common/util.js'


export const SearchField = React.memo(({
  focus,
  isDisabled,
  onSearch,
  placeholder,
  query,
  tabIndex
}) => {
  let intl = useIntl()
  let input = useRef()

  useGlobalEvent(focus, () => {
    if (!isDisabled) input.current?.focus()
  })

  let handleChange = useDebounce(onSearch)

  let handleCancel = useEvent(() => {
    handleChange.cancel()

    if (!blank(query)) {
      onSearch('')
    }
  })

  return (
    <div className="search">
      <IconSearch/>
      <Input
        ref={input}
        className="search-input form-control"
        isDisabled={isDisabled}
        tabIndex={tabIndex}
        value={query}
        // TODO the Input component should probably do the translation
        placeholder={intl.formatMessage({ id: placeholder })}
        onCancel={handleCancel}
        onChange={handleChange}
        onCommit={handleChange.flush}/>
      {!blank(query) &&
        <Button
          icon={<IconXSmall/>}
          onClick={handleCancel}/>}
    </div>
  )
})

SearchField.propTypes = {
  focus: string,
  isDisabled: bool,
  onSearch: func.isRequired,
  placeholder: string.isRequired,
  query: string.isRequired,
  tabIndex: number
}

SearchField.defaultProps = {
  placeholder: 'toolbar.search.placeholder',
  tabIndex: TABS.SearchField
}
