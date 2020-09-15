import React from 'react'
import { injectIntl } from 'react-intl'
import { bool, func, object, string } from 'prop-types'
import { IconSearch, IconXSmall } from '../icons'
import { Button } from '../button'
import { Input } from '../input'
import { TABS } from '../../constants'
import { blank } from '../../common/util'
import debounce from 'lodash.debounce'


class SearchField extends React.PureComponent {
  get placeholder() {
    return this.props.intl.formatMessage({ id: 'toolbar.search.placeholder' })
  }

  handleCancel = () => {
    this.handleChange.cancel()

    if (!blank(this.props.query)) {
      this.props.onSearch('')
    }
  }

  handleChange = debounce(query => {
    this.props.onSearch(query)
  }, 250)

  handleCommit = () => {
    this.handleChange.flush()
  }

  render() {
    return (
      <div className="search">
        <IconSearch/>
        <Input
          className="search-input form-control"
          isDisabled={this.props.isDisabled}
          tabIndex={TABS.SearchField}
          value={this.props.query}
          placeholder={this.placeholder}
          onCancel={this.handleCancel}
          onChange={this.handleChange}
          onCommit={this.handleCommit}/>
        {!blank(this.props.query) &&
          <Button
            icon={<IconXSmall/>}
            onClick={this.handleCancel}/>}
      </div>
    )
  }

  static propTypes = {
    intl: object,
    isDisabled: bool,
    query: string.isRequired,
    onSearch: func.isRequired
  }
}

const SearchFieldContainer = injectIntl(SearchField)

export {
  SearchFieldContainer as SearchField
}
