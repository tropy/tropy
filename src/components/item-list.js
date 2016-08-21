'use strict'

const React = require('react')
const { PropTypes } = React
const classes = require('classnames')

const cols = [
  { width: '40%', field: { name: 'title', type: 'string' } },
  { width: '25%', field: { name: 'type', type: 'string' } },
  { width: '15%', field: { name: 'date', type: 'date' } },
  {
    width: '10%',
    order: 'ascending',
    field: { name: 'box', type: 'number' }
  },
  { width: '10%', field: { name: 'photos', type: 'number' } }
]

const Header = ({ width, field, order }, idx) => (
  <div key={idx}
    className={classes(['metadata-head', field.type, order])}
    style={{ width }}>
    {field.name}
  </div>
)

Header.propTypes = {
  width: PropTypes.string,
  field: PropTypes.object,
  order: PropTypes.string
}

const List = ({ columns }) => (
  <div className="item-list">
    <div className="item-list-head-container">
      <ul className="item-list item-list-head">
        <li className="item-head">
          {columns.map(Header)}
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

List.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object)
}

List.defaultProps = {
  columns: cols
}

const CellIcon = ({ image, width, height }) => {
  return (image) ? (
    <img
      src={`${image}-${width}.jpg`}
      srcSet={`${image}-${width}-2x.jpg 2x`}
      width={width} height={height}/>
  ) : null
}

CellIcon.propTypes = {
  image: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
}

CellIcon.defaultProps = {
  width: 24, height: 24
}

const Cell = ({ image, type, value, width }) => (
  <div className={classes(['metadata', type])} style={{ width }}>
    <CellIcon image={image} width={24} height={24}/>
    {value}
  </div>
)

Cell.propTypes = {
  image: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  width: PropTypes.string
}

const ListItem = ({ data, active, columns }) => (
  <li className={classes({ item: true, active })}>
    {columns.map((column, idx) => (
      <Cell key={idx}
        type={column.field.type}
        value={data[column.field.name].value}
        image={idx ? null : data.image}
        width={column.width}/>
    ))}
  </li>
)

ListItem.propTypes = {
  active: PropTypes.bool,
  data: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object)
}

ListItem.defaultProps = {
  active: false,
  columns: cols
}


module.exports = {
  ItemList: List,
  ItemListItem: ListItem
}
