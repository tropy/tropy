'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { Tab, Tabs } = require('../tabs')
const { IconMetadata, IconHangtag } = require('../icons')
const { MetadataPanel } = require('../metadata')
const { TagPanel } = require('../tag')
const { PANEL: { METADATA, TAGS } } = require('../../constants/ui')
const { array, func, object, oneOf } = require('prop-types')


class ItemTabHeader extends PureComponent {
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
          <IconHangtag/>
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


const ItemTabBody = ({ items, keymap, setPanel, tab, ...props }) => {
  switch (true) {
    case (items.length === 0):
      return null
    case (tab === METADATA):
      return (
        <MetadataPanel {...props}
          ref={setPanel}
          items={items}
          keymap={keymap.MetadataList}/>
      )
    case (tab === TAGS):
      return (
        <TagPanel {...props}
          ref={setPanel}
          items={items}
          keymap={keymap.TagList}/>
      )
    default:
      return null
  }
}

ItemTabBody.propTypes = {
  items: array.isRequired,
  keymap: object.isRequired,
  setPanel: func.isRequired,
  tab: oneOf([METADATA, TAGS]).isRequired
}


module.exports = {
  ItemTabHeader,
  ItemTabBody
}
