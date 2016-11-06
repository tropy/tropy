'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NoteList } = require('../notelist')
const { PanelGroup, Panel } = require('../panel')
const { Viewer } = require('../viewer')
const { Fields } = require('../metadata')
const { getSelectedItem } = require('../../selectors/items')
const { frameless } = ARGS

const {
  IconPhoto, IconMetadata, IconNote, IconTag, IconPlus
} = require('../icons')

const TEMPLATE = [
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

const Item = ({ selection }) => {
  let fp

  if (selection.length === 1) {
    fp = (
      <Panel header={
        <Tabs justified>
          <Tab active><IconMetadata/>Metadata</Tab>
          <Tab><IconTag/>Tags</Tab>
        </Tabs>
      }>
        <Fields id={selection[0]} template={TEMPLATE}/>
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

          <Panel header={
            <Toolbar>
              <div className="toolbar-left">
                <IconPhoto/>
                <h4>Photos</h4>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-icon">
                  <IconPlus/>
                </button>
              </div>
            </Toolbar>
          }>
            <ul className="photo-list">
              <li className="photo active">
                <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
                  width={24} height={24} className="thumbnail"/>
                <div className="file-name">PC110098.JPG</div>
              </li>
              <li className="photo">
                <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
                  width={24} height={24} className="thumbnail"/>
                <div className="file-name">PC110099.JPG</div>
              </li>
            </ul>
          </Panel>

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
  selection: PropTypes.arrayOf(PropTypes.number)
}


module.exports = {
  Item: connect(
    (state) => ({
      item: getSelectedItem(state),
      selection: state.nav.items
    }),

    (dispatch) => ({
      addPhoto: () => dispatch()
    })
  )(Item)
}
