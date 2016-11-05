'use strict'

const React = require('react')
const createFragment = require('react-addons-create-fragment')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NoteList } = require('../notelist')
const { PanelGroup, Panel } = require('../panel')
const { Viewer } = require('../viewer')
const { frameless } = ARGS
const cn = require('classnames')

const {
  IconPhoto, IconMetadata, IconNote, IconTag, IconPlus
} = require('../icons')

const TEMPLATE = [
  'type', 'title', 'description', 'date', 'creator', 'publisher',
  'source', 'rights', 'box', 'folder'
]

const Item = ({ item, data }) => (
  <section id="item" className={cn({ disabled: !item })}>
    <div className="resizable" style={{ width: '320px' }}>
      <PanelGroup header={
        <Toolbar draggable={frameless}/>
      }>

        <Panel header={
          <Tabs justified>
            <Tab active><IconMetadata/>Metadata</Tab>
            <Tab><IconTag/>Tags</Tab>
          </Tabs>
        }>
          <dl className="dl-horizontal">
            {TEMPLATE.map(property => createFragment({
              dt: <dt>{property}</dt>,
              dd: <dd>{data[property] ? data[property].value : null}</dd>
            }))}
          </dl>
        </Panel>

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

Item.propTypes = {
  data: PropTypes.object,
  item: PropTypes.object
}


module.exports = {
  Item: connect(
    ({ nav, metadata, items }) => ({
      data: metadata[nav.item] || {},
      item: items[nav.item]
    }),

    (dispatch) => ({
      addPhoto: () => dispatch()
    })
  )(Item)
}
