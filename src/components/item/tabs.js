'use strict'

const React = require('react')
const { PureComponent } = React
const { PropTypes } = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { Tab, Tabs } = require('../tabs')
const { IconMetadata, IconTag } = require('../icons')
const { MetadataPanel } = require('../metadata')
const { TagPanel } = require('../tag')
const { PANEL: { METADATA, TAGS } } = require('../../constants/ui')
const { bool, func, oneOf } = PropTypes


class ItemTabs extends PureComponent {
  isActive(tab) {
    return this.props.tab === tab
  }

  handleSelectMetadata = () => {
    if (this.props.tab !== METADATA) {
      this.props.onChange(METADATA)
    }
  }

  handleSelectTags = () => {
    if (this.props.tab !== TAGS) {
      this.props.onChange(TAGS)
    }
  }

  render() {
    return (
      <Tabs justified>
        <Tab
          isActive={this.isActive(METADATA)}
          onActivate={this.handleSelectMetadata}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata.tab"/>
        </Tab>
        <Tab
          isActive={this.isActive(TAGS)}
          onActivate={this.handleSelectTags}>
          <IconTag/>
          <FormattedMessage id="panel.tags.tab"/>
        </Tab>
      </Tabs>
    )
  }

  static propTypes = {
    tab: oneOf([METADATA, TAGS]).isRequired,
    onChange: func.isRequired
  }
}


class ItemTab extends PureComponent {
  render() {
    const { isEmpty, tab, ...props } = this.props

    switch (true) {
      case (isEmpty):
        return null
      case (tab === METADATA):
        return <MetadataPanel {...props}/>
      case (tab === TAGS):
        return <TagPanel {...props}/>
      default:
        return null
    }
  }

  static propTypes = {
    isEmpty: bool.isRequired,
    tab: oneOf([METADATA, TAGS]).isRequired
  }
}


module.exports = {
  ItemTab,
  ItemTabs
}
