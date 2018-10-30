'use strict'

const React = require('react')
const { injectIntl, intlShape } = require('react-intl')
const { IconSearch, IconXSmall } = require('../icons')
const { Button } = require('../button')
const { Collapse, Fade } = require('../fx')
const { Input } = require('../input')
const debounce = require('lodash.debounce')
const { blank } = require('../../common/util')
const { func, string } = require('prop-types')


class TagFilter extends React.Component {
  state = {
    isCollapsed: true
  }

  get placeholder() {
    return this.props.intl.formatMessage({ id: 'sidebar.tags.filter' })
  }

  get isCollapsed() {
    return this.state.isCollapsed && !this.props.value
  }

  expand = () => {
    this.setState({ isCollapsed: false })
  }

  handleBlur = () => {
    this.setState({ isCollapsed: true })
  }

  handleCancel = () => {
    this.handleChange.cancel()

    if (!blank(this.props.value)) {
      this.props.onChange('')
    }
  }

  handleChange = debounce(filter => {
    this.props.onChange(filter)
  }, 250)

  handleCommit = () => {
    this.handleChange.flush()
  }

  render() {
    let { isCollapsed } = this

    return (
      <>
        <Fade in={isCollapsed}>
          <Button
            icon={<IconSearch/>}
            onClick={this.expand}/>
        </Fade>
        <Collapse in={!isCollapsed}>
          <div className="tag-filter">
            <div className="tag-filter-container">
              <Input
                autofocus
                className="tag-filter-input form-control"
                value={this.props.value}
                placeholder={this.placeholder}
                onBlur={this.handleBlur}
                onCancel={this.handleCancel}
                onChange={this.handleChange}
                onCommit={this.handleCommit}/>
              {!blank(this.props.value) &&
                <Button
                  icon={<IconXSmall/>}
                  noFocus
                  onClick={this.handleCancel}/>}
            </div>
          </div>
        </Collapse>
      </>
    )
  }

  static propTypes = {
    intl: intlShape,
    onChange: func.isRequired,
    value: string.isRequired
  }
}

module.exports.TagFilter = injectIntl(TagFilter)
