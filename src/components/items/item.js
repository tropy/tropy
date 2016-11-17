'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NoteList } = require('../notelist')
const { PanelGroup, Panel } = require('../panel')
const { PhotoPanel } = require('../photo/panel')
const { Viewer } = require('../viewer')
const { Fields } = require('../metadata')
const { getSelectedItem } = require('../../selectors/items')
const { frameless } = ARGS
const act = require('../../actions')

const {
  IconMetadata, IconNote, IconTag, IconPlus
} = require('../icons')

const ITEM_TEMPLATE = [
  { name: 'type', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'date', type: 'date' },
  { name: 'creator', type: 'name' },
  { name: 'publisher', type: 'text' },
  { name: 'source', type: 'text' },
  { name: 'rights', type: 'url' },
  { name: 'box', type: 'number' },
  { name: 'folder', type: 'text' }
]

const PHOTO_TEMPLATE = [
  { name: 'title', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'date', type: 'date' }
]

class Item extends Component {
  constructor(props) {
    super(props)
  }


  get disabled() {
    return !this.props.item || !!this.props.item.deleted
  }

  select = {
    tab: {
      metadata: () => {
        if (this.props.panel.tab !== 'metadata') {
          this.props.onSelectTab('metadata')
        }
      },
      tags: () => {
        if (this.props.panel.tab !== 'tags') {
          this.props.onSelectTab('tags')
        }
      }
    }
  }

  renderComboTabs() {
    const { panel } = this.props

    return (
      <Tabs justified>
        <Tab
          active={panel.tab === 'metadata'}
          onActivate={this.select.tab.metadata}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata"/>
        </Tab>
        <Tab
          active={panel.tab === 'tags'}
          onActivate={this.select.tab.tags}>
          <IconTag/>
          <FormattedMessage id="panel.tags"/>
        </Tab>
      </Tabs>
    )
  }

  renderComboPanel() {
    const { selection, panel } = this.props

    switch (selection.length) {
      case 0:
        return <span>No items selected</span>

      case 1:
        switch (panel.tab) {
          case 'metadata':
            return this.renderMetadataPanel()
          case 'tags':
            return this.renderTagsPanel()
          default:
            return null
        }

      default:
        return <span>{selection.length} items selected</span>
    }
  }

  renderMetadataPanel() {
    const { photo, item } = this.props

    return (
      <div>
        {photo &&
          <Fields
            id={photo}
            disabled={this.disabled}
            template={PHOTO_TEMPLATE}/>}
        {item &&
          <Fields
            id={item.id}
            disabled={this.disabled}
            template={ITEM_TEMPLATE}/>}
      </div>
    )
  }

  renderTagsPanel() {
    const { item } = this.props

    return (
      <ul>
        {item && item.tags.map(tag => <li key={tag}>{tag}</li>)}
      </ul>
    )
  }

  renderNotesToolbar() {
    return (
      <Toolbar>
        <div className="toolbar-left">
          <IconNote/><h4>Notes</h4>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-icon"><IconPlus/></button>
        </div>
      </Toolbar>
    )
  }

  renderToolbar() {
    return (
      <Toolbar draggable={frameless}/>
    )
  }

  render() {
    const { item } = this.props

    return (
      <section id="item">
        <div className="resizable" style={{ width: '320px' }}>
          <PanelGroup header={this.renderToolbar()}>
            <Panel header={this.renderComboTabs()}>
              {this.renderComboPanel()}
            </Panel>

            <PhotoPanel item={item}/>

            <Panel header={this.renderNotesToolbar()}>
              <NoteList/>
            </Panel>

          </PanelGroup>
          <div className="resizable-handle-col resizable-handle-left"/>
        </div>
        <Viewer/>
      </section>
    )
  }

  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      tags: PropTypes.arrayOf(PropTypes.number).isRequired,
      deleted: PropTypes.string
    }),

    panel: PropTypes.shape({
      tab: PropTypes.oneOf(['metadata', 'tags']).isRequired
    }).isRequired,

    photo: PropTypes.number,
    selection: PropTypes.arrayOf(PropTypes.number),

    onSelectTab: PropTypes.func
  }
}


module.exports = {
  Item: connect(
    (state) => ({
      item: getSelectedItem(state),
      photo: state.nav.photo,
      selection: state.nav.items,
      panel: state.nav.panel
    }),

    (dispatch) => ({
      onSelectTab(tab) {
        dispatch(act.nav.panel.tab.select(tab))
      }
    })
  )(Item)
}
