'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Tab, Tabs } = require('../tabs')
const { IconMetadata, IconTag } = require('../icons')
const { MetadataPanel } = require('../metadata')
const { TagPanel } = require('../metadata')
const { PANEL: { METADATA, TAGS } } = require('../../constants/ui')
const { array, func, oneOf } = PropTypes


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
          <FormattedMessage id="panel.tags"/>
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
    const { items, tab, tags, ...props } = this.props

    switch (items.length) {
      case 0:
        return  null
      case 1:
        switch (tab) {
          case METADATA:
            return (
              <MetadataPanel {...props} item={items[0]}/>
            )
          case TAGS:
            return (
              <TagPanel {...props} tags={tags}/>
            )
          default:
            return null
        }
      default:
        // BulkEditor
    }
  }

  static propTypes = {
    items: array.isRequired,
    tab: oneOf([METADATA, TAGS]).isRequired,
    tags: array.isRequired,
  }
}


module.exports = {
  ItemTab,
  ItemTabs
}
