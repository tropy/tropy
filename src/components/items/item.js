'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NoteList } = require('../notelist')
const { PanelGroup, Panel } = require('../panel')
const { PhotoPanel } = require('../photo/panel')
const { Viewer } = require('../viewer')
const { Fields } = require('../metadata')
const { getSelectedItem } = require('../../selectors/items')
const { frameless } = ARGS

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

const Item = ({ photo, item, selection }) => {
  let fp

  if (selection.length === 1 && item) {
    fp = (
      <Panel header={
        <Tabs justified>
          <Tab active><IconMetadata/>Metadata</Tab>
          <Tab><IconTag/>Tags</Tab>
        </Tabs>
      }>
        { photo &&
          <Fields
            id={photo}
            disabled={!!item.deleted}
            template={PHOTO_TEMPLATE}/>
        }
        <Fields
          id={item.id}
          disabled={!!item.deleted}
          template={ITEM_TEMPLATE}/>
      </Panel>
    )
  } else {
    fp = (
      <Panel>
        <span>{selection.length} items selected</span>
      </Panel>
    )
  }

  return (
    <section id="item">
      <div className="resizable" style={{ width: '320px' }}>
        <PanelGroup header={
          <Toolbar draggable={frameless}/>
        }>
          {fp}

          <PhotoPanel item={item}/>

          <Panel header={
            <Toolbar>
              <div className="toolbar-left">
                <IconNote/><h4>Notes</h4>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-icon"><IconPlus/></button>
              </div>
            </Toolbar>
          }>
            <NoteList/>
          </Panel>

        </PanelGroup>
        <div className="resizable-handle-col resizable-handle-left"/>
      </div>
      <Viewer/>
    </section>
  )
}

Item.propTypes = {
  item: PropTypes.object,
  photo: PropTypes.number,
  selection: PropTypes.arrayOf(PropTypes.number)
}


module.exports = {
  Item: connect(
    (state) => ({
      item: getSelectedItem(state),
      photo: state.nav.photo,
      selection: state.nav.items
    })
  )(Item)
}
