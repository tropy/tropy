'use strict'

const React = require('react')
const { PropTypes } = React
const classes = require('classnames')

const col1 = { width: '40%' }
const col2 = { width: '25%' }
const col3 = { width: '15%' }
const col4 = { width: '10%' }
const col5 = { width: '10%' }


const List = () => (
  <div className="item-list">
    <div className="item-list-head-container">
      <ul className="item-list item-list-head">
        <li className="item-head">
          <div className="metadata-head" style={col1}>Title</div>
          <div className="metadata-head" style={col2}>Type</div>
          <div className="metadata-head" style={col3}>Date</div>
          <div className="metadata-head number ascending" style={col4}>Box</div>
          <div className="metadata-head number" style={col5}>Photos</div>
        </li>
      </ul>
    </div>
    <div className="item-list-container">
      <ul className="item-list">
        <ListItem data={{
          image: 'dev/dummy',
          title: {
            value: 'Application Norman Bailey',
            type: 'string'
          },
          type: {
            value: 'Application Form',
            type: 'string'
          },
          date: {
            value: '1897-07-26',
            type: 'date'
          },
          box: {
            value: '17',
            type: 'number'
          },
          photos: {
            value: '2',
            type: 'number'
          }
        }}/>
        <ListItem data={{
          image: 'dev/dummy',
          title: {
            value: 'Norman Bailey',
            type: 'string'
          },
          type: {
            value: 'Portrait',
            type: 'string'
          },
          date: {
            value: '1844',
            type: 'date'
          },
          box: {
            value: '17',
            type: 'number'
          },
          photos: {
            value: '1',
            type: 'number'
          }
        }}/>
        <ListItem data={{
          image: 'dev/dummy',
          title: {
            value: 'Application H. F. Cary',
            type: 'string'
          },
          type: {
            value: 'Application Form',
            type: 'string'
          },
          date: {
            value: '1899-10-24',
            type: 'date'
          },
          box: {
            value: '17',
            type: 'number'
          },
          photos: {
            value: '2',
            type: 'number'
          }
        }}/>
        <ListItem data={{
          image: 'dev/dummy',
          title: {
            value: 'Frank Cary',
            type: 'string'
          },
          type: {
            value: 'Portrait',
            type: 'string'
          },
          date: {
            value: '1868',
            type: 'date'
          },
          box: {
            value: '17',
            type: 'number'
          },
          photos: {
            value: '1',
            type: 'number'
          }
        }}/>
        <ListItem active data={{
          image: 'dev/dummy',
          title: {
            value: 'Denver to Chicago',
            type: 'string'
          },
          type: {
            value: 'Correspondence',
            type: 'string'
          },
          date: {
            value: '1899-12-24',
            type: 'date'
          },
          box: {
            value: '27',
            type: 'number'
          },
          photos: {
            value: '2',
            type: 'number'
          }
        }}/>
      </ul>
    </div>
  </div>
)

const ColumnIcon = ({ image, width, height }) => {
  return (image) ? (
    <img
      src={`${image}-${width}.jpg`}
      srcSet={`${image}-${width}-2x.jpg 2x`}
      width={width} height={height}/>
  ) : null
}

ColumnIcon.propTypes = {
  image: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
}

ColumnIcon.defaultProps = {
  width: 24, height: 24
}

const Column = ({ image, type, value, style }) => (
  <div className={classes({ metadata: true, [type]: type })} style={style}>
    <ColumnIcon image={image} width={24} height={24}/>
    {value}
  </div>
)

Column.propTypes = {
  image: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  style: PropTypes.object
}

const ListItem = ({ data, active }) => (
  <li className={classes({ item: true, active })}>
    <Column {...data.title} image={data.image} style={col1}/>
    <Column {...data.type} style={col2}/>
    <Column {...data.date} style={col3}/>
    <Column {...data.box} style={col4}/>
    <Column {...data.photos} style={col5}/>
  </li>
)

ListItem.propTypes = {
  active: PropTypes.bool,
  data: PropTypes.object
}


module.exports = {
  ItemList: List,
  ItemListItem: ListItem
}
