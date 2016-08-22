'use strict'

const React = require('react')

const { PropTypes } = React
const { ListItem } = require('./list-item')
const { ListHead } = require('./list-head')

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

const itms = [
  {
    id: 1,
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
  },
  {
    id: 2,
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
  },
  {
    id: 3,
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
  },
  {
    id: 4,
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
  },
  {
    id: 5,
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
  }
]


const List = ({ items, columns }) => (
  <div className="item-list">
    <div className="item-list-head-container">
      <ListHead columns={columns}/>
    </div>
    <div className="item-list-container">
      <ul className="item-list">
        {items.map((item) => (
          <ListItem key={item.id} data={{ ...item }} columns={columns}/>
        ))}
      </ul>
    </div>
  </div>
)

List.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object)
}

List.defaultProps = {
  columns: cols,
  items: itms
}

module.exports = {
  List
}
