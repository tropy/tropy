'use strict'

const React = require('react')
const { PureComponent } = React
const { element, string } = require('prop-types')
const cx = require('classnames')

const Icon = ({ children, className, name }) => (
  <span className={cx('icon', `icon-${name}`, className)}>
    {children}
  </span>
)

Icon.propTypes = {
  children: element.isRequired,
  className: string,
  name: string.isRequired
}

module.exports = { Icon }


function i(name, svg) {
  const icon = class extends PureComponent {
    render() {
      const { className } = this.props

      return (
        <Icon className={className} name={name.toLowerCase()}>{svg}</Icon>
      )
    }
  }

  icon.propTypes = {
    className: string
  }

  icon.displayName = `Icon${name}`

  module.exports[icon.displayName] = icon
}

/* eslint-disable max-len */


i('Circle', (
  <svg width="10" height="10">
    <circle className="border" fill="currentColor" cx="5" cy="5" r="5"/>
    <circle className="color" fill="currentColor" cx="5" cy="5" r="4"/>
  </svg>
))

i('CrescentCircle', (
  <svg width="7" height="10">
    <path  className="border" fill="currentColor" d="M2,0A4.947,4.947,0,0,0,.614.219,5.968,5.968,0,0,1,1.5,1.05h.008l1.68.945A5.964,5.964,0,0,1,4,5a5.964,5.964,0,0,1-.812,3.005l-1.68.945-.011,0a5.968,5.968,0,0,1-.883.827A4.947,4.947,0,0,0,2,10,5,5,0,0,0,2,0Z"/>
    <path className="color" fill="currentColor" d="M2,1a3.947,3.947,0,0,0-.492.05A5.97,5.97,0,0,1,3,5,5.97,5.97,0,0,1,1.508,8.95,3.947,3.947,0,0,0,2,9,4,4,0,0,0,2,1Z"/>
  </svg>
))


/* 12 x 12 */

i('Lock', (
  <svg width="12" height="12">
    <g className="line" fill="currentColor">
      <path d="M9,4V3A3,3,0,0,0,3,3V4H1v8H11V4ZM4,3A2,2,0,0,1,8,3V4H4Zm6,8H2V5h8Z"/>
    </g>
  </svg>
))

i('WarningSm', (
  <svg width="12" height="12">
    <g className="line" fill="currentColor">
      <path d="M11.606,10.211,6.894.789C6.4-.2,5.6-.2,5.106.789L.394,10.211A1.139,1.139,0,0,0,1.5,12h9A1.139,1.139,0,0,0,11.606,10.211ZM7,10.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5v-1A.5.5,0,0,1,5.5,9h1a.5.5,0,0,1,.5.5Zm0-3a.5.5,0,0,1-.5.5h-1A.5.5,0,0,1,5,7.5v-4A.5.5,0,0,1,5.5,3h1a.5.5,0,0,1,.5.5Z"/>
    </g>
  </svg>
))

i('Warning', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,2.136c.018.028.038.06.059.1l6.118,11.471a.711.711,0,0,1,.09.254A.711.711,0,0,1,14,14H2a.711.711,0,0,1-.267-.04.711.711,0,0,1,.09-.254L7.941,2.235c.021-.039.04-.071.059-.1m0-1.1a1.148,1.148,0,0,0-.941.728L.941,13.235A1.1,1.1,0,0,0,2,15H14a1.1,1.1,0,0,0,1.059-1.765L8.941,1.765A1.148,1.148,0,0,0,8,1.037ZM9,9.5V6a.5.5,0,0,0-.5-.5h-1A.5.5,0,0,0,7,6V9.5a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,9,9.5Zm0,3v-1a.5.5,0,0,0-.5-.5h-1a.5.5,0,0,0-.5.5v1a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,9,12.5Z"/>
    </g>
  </svg>
))

i('WarningOverlay', (
  <svg width="16" height="16" >
    <path d="M8,1.037a1.148,1.148,0,0,0-.941.728L.941,13.235A1.1,1.1,0,0,0,2,15H14a1.1,1.1,0,0,0,1.059-1.765L8.941,1.765A1.148,1.148,0,0,0,8,1.037Z" opacity="0.5"/>
    <path d="M14.176,13.706,8.059,2.235c-.021-.039-.04-.071-.059-.1-.018.028-.038.06-.059.1L1.824,13.706a.711.711,0,0,0-.09.254A.711.711,0,0,0,2,14H14a.711.711,0,0,0,.267-.04A.71.71,0,0,0,14.176,13.706ZM9,12.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5v-1a.5.5,0,0,1,.5-.5h1a.5.5,0,0,1,.5.5Zm0-3a.5.5,0,0,1-.5.5h-1A.5.5,0,0,1,7,9.5V6a.5.5,0,0,1,.5-.5h1A.5.5,0,0,1,9,6Z" fill="#fff"/>
  </svg>
))

/* 16 x 16 */

i('AlignCenter', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M13,3H3V2H13Zm2,2H1V6H15ZM13,8H3V9H13Zm2,3H1v1H15Zm-2,3H3v1H13Z"/>
    </g>
  </svg>
))

i('AlignLeft', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M13,3H1V2H13Zm2,2H1V6H15ZM13,8H1V9H13Zm2,3H1v1H15Zm-2,3H1v1H13Z"/>
    </g>
  </svg>
))

i('AlignRight', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M3,14H15v1H3ZM1,12H15V11H1ZM3,9H15V8H3ZM1,6H15V5H1ZM3,3H15V2H3Z"/>
    </g>
  </svg>
))

i('B', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M3,15H9.3c2.728,0,4.862-1.426,4.862-3.969A3.253,3.253,0,0,0,11,7.646V7.492a2.951,2.951,0,0,0,2.492-3.056C13.492,2.282,11.769,1,9.195,1H3ZM6.333,3.41h2.01c1.179,0,1.856.636,1.856,1.61,0,1-.667,1.662-2.226,1.662H6.333Zm0,5.467H8.5c1.487,0,2.246.738,2.246,1.867S9.995,12.59,8.159,12.59H6.333Z"/>
    </g>
  </svg>
))

i('Book16', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M14,0H4a.994.994,0,0,0-.716.306L1.305,2.284A.994.994,0,0,0,1,3V15a1,1,0,0,0,1,1H12a1,1,0,0,0,1-1V3a1,1,0,0,0-1-1H3L4,1H14V14a1,1,0,0,0,1-1V1A1,1,0,0,0,14,0ZM12,15H2V3H12Z"/>
    </g>
  </svg>
))

i('BookLock', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M7,16H2a1,1,0,0,1-1-1V3a.994.994,0,0,1,.305-.716L3.284.306A.994.994,0,0,1,4,0H14a1,1,0,0,1,1,1V5H14V1H4L3,2h9a1,1,0,0,1,1,1V5H12V3H2V15H7Zm9-6v6H8V10H9V9a3,3,0,0,1,6,0v1Zm-6,0h4V9a2,2,0,0,0-4,0Zm5,1H9v4h6Z"/>
    </g>
  </svg>
))

i('BookTemplate', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M14,0H4a.994.994,0,0,0-.716.306L1.305,2.284A.994.994,0,0,0,1,3V15a1,1,0,0,0,1,1H7V15H2V3H12V5h1V3a1,1,0,0,0-1-1H3L4,1H14V5h1V1a1,1,0,0,0-1-1ZM12.707,6H8V16h8V9.293L12.707,6ZM9,15V7h3v3h3v5Zm4-6V7.707L14.293,9ZM11,9H10v1h1V9Zm3,2H10v1h4V11Zm0,2H10v1h4V13Z"/>
    </g>
  </svg>
))

i('BulletList', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M4,3.5A1.5,1.5,0,1,1,2.5,2,1.5,1.5,0,0,1,4,3.5ZM2.5,10A1.5,1.5,0,1,0,4,11.5,1.5,1.5,0,0,0,2.5,10ZM6,2V3H16V2Zm8,3H6V6h8ZM6,11H16V10H6Zm0,3h8V13H6Z"/>
    </g>
  </svg>
))

i('Chevron7', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="5.707,10 8.5,7.207 11.293,10 12,9.293 8.5,5.793 5,9.293"/>
    </g>
  </svg>
))

i('Chevron9', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="4.707 10 8.5 6.207 12.293 10 13 9.293 8.5 4.793 4 9.293 4.707 10"/>
    </g>
  </svg>
))

i('Chevron16', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="15.146,11.854 8,4.707 0.854,11.854 0.146,11.146 8,3.293 15.854,11.146"/>
    </g>
  </svg>
))

i('Clock', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8.5,0A7.5,7.5,0,1,0,16,7.5,7.5,7.5,0,0,0,8.5,0Zm0,14A6.5,6.5,0,1,1,15,7.5,6.507,6.507,0,0,1,8.5,14Zm3.354-3.854a.5.5,0,1,1-.707.707l-3-3A.507.507,0,0,1,8,7.5v-5a.5.5,0,0,1,1,0V7.293Z"/>
    </g>
  </svg>
))

i('Contrast', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,1a7,7,0,1,0,7,7A7.008,7.008,0,0,0,8,1ZM2,8A6.007,6.007,0,0,1,8,2V14A6.007,6.007,0,0,1,2,8Z"/>
    </g>
  </svg>
))

i('Copy', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M12,3V0H1V13H4v3H15V3ZM2,1h9V12H2ZM14,15H5V13h7V4h2Z"/>
    </g>
  </svg>
))

i('Drop', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,1.439c2.525,2.7,5,6.308,5,8.561A5,5,0,0,1,3,10C3,7.747,5.475,4.141,8,1.439M8,0C6,2,2,6.686,2,10a6,6,0,0,0,12,0c0-3.314-4-8-6-10Z"/>
    </g>
  </svg>
))

i('Export', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M16,10v5H1V10H2v4H15V10ZM8,2.707V11H9V2.707L11.293,5,12,4.293,8.5.793,5,4.293,5.707,5Z"/>
    </g>
  </svg>
))

i('Fill', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M13.207,7.5l-2.854,2.854-.707-.707L11.293,8H4.707L6.354,9.646l-.707.707L2.793,7.5,5.646,4.646l.707.707L4.707,7h6.586L9.646,5.354l.707-.707ZM1,0H0V15H1ZM16,0H15V15h1Z"/>
    </g>
  </svg>
))

i('Fit', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M2,14H7v1H1V9H2ZM9,1V2h5V7h1V1Z"/>
    </g>
  </svg>
))

i('Folder', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M15,3H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v10c0,0.552,0.448,1,1,1h14c0.552,0,1-0.448,1-1V4C16,3.448,15.552,3,15,3z M15,14H1V6h14V14z M1,5V4h1c0.379,0,0.725-0.214,0.894-0.553L3.618,2h3.764v0l0.724,1.447C8.275,3.786,8.621,4,9,4h6v1H1z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M15,15H1c-0.552,0-1-0.448-1-1V7c0-0.552,0.448-1,1-1h14c0.552,0,1,0.448,1,1v7C16,14.552,15.552,15,15,15z M16,5V4c0-0.552-0.448-1-1-1H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v1H16z"/>
    </g>
  </svg>
))

i('Grid', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M6,2v4H2V2H6 M6,1H2C1.448,1,1,1.448,1,2v4c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1V2C7,1.448,6.552,1,6,1L6,1z"/>
      <path d="M14,2v4h-4V2H14 M14,1h-4C9.448,1,9,1.448,9,2v4c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1V2C15,1.448,14.552,1,14,1L14,1z"/>
      <path d="M6,10v4H2v-4H6 M6,9H2c-0.552,0-1,0.448-1,1v4c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1v-4C7,9.448,6.552,9,6,9L6,9z"/>
      <path d="M14,10v4h-4v-4H14 M14,9h-4c-0.552,0-1,0.448-1,1v4c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1v-4C15,9.448,14.552,9,14,9L14,9z"/>
    </g>
  </svg>
))

i('GridSmall', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M6,3v3H3V3H6 M6,2H3C2.448,2,2,2.448,2,3v3c0,0.552,0.448,1,1,1h3c0.552,0,1-0.448,1-1V3C7,2.448,6.552,2,6,2L6,2z"/>
      <path d="M13,3v3h-3V3H13 M13,2h-3C9.448,2,9,2.448,9,3v3c0,0.552,0.448,1,1,1h3c0.552,0,1-0.448,1-1V3C14,2.448,13.552,2,13,2L13,2z"/>
      <path d="M13,10v3h-3v-3H13 M13,9h-3c-0.552,0-1,0.448-1,1v3c0,0.552,0.448,1,1,1h3c0.552,0,1-0.448,1-1v-3C14,9.448,13.552,9,13,9L13,9z"/>
      <path d="M6,10v3H3v-3H6 M6,9H3c-0.552,0-1,0.448-1,1v3c0,0.552,0.448,1,1,1h3c0.552,0,1-0.448,1-1v-3C7,9.448,6.552,9,6,9L6,9z"/>
    </g>
  </svg>
))

i('Grip', (
  <svg width="16" height="18">
    <g className="line" fill="currentColor">
      <path d="M7,2H5V0H7Zm4-2H9V2h2ZM7,4H5V6H7Zm4,0H9V6h2ZM7,8H5v2H7Zm4,0H9v2h2ZM7,12H5v2H7Zm4,0H9v2h2ZM7,16H5v2H7Zm4,0H9v2h2Z"/>
    </g>
  </svg>
))

i('Hand', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8.7,1a.875.875,0,0,1,.875.875V7.267a.437.437,0,0,0,.875,0h0V2.75a.875.875,0,0,1,1.75,0v5.6a.249.249,0,0,0,.249.249.245.245,0,0,0,.243-.194l.575-3.259a.875.875,0,0,1,1.723.3l-1.1,6.251c0,.009-.008.016-.01.026A4.585,4.585,0,0,1,9.189,15,4.823,4.823,0,0,1,4.76,12.5L1.7,7.188a1.749,1.749,0,0,1,2.391.64L5.2,9.75h0V3.625a.875.875,0,1,1,1.75,0V7.6l.006,0a.435.435,0,0,0,.869-.031V1.875A.875.875,0,0,1,8.7,1m0-1A1.877,1.877,0,0,0,6.821,1.875v.032A1.875,1.875,0,0,0,4.2,3.625V6.486a2.745,2.745,0,0,0-3-.164l-.866.5.5.866,3.045,5.274A5.809,5.809,0,0,0,9.189,16a5.6,5.6,0,0,0,5.636-3.942l.014-.028.031-.161,1.1-6.249A1.876,1.876,0,0,0,13.2,3.664V2.75a1.874,1.874,0,0,0-2.787-1.638A1.878,1.878,0,0,0,8.7,0Z"/>
    </g>
  </svg>
))

i('Hangtag', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M6.086,1l8.5,8.5L9.5,14.586L1,6.086V1H6.086 M6.5,0h-6C0.224,0,0,0.224,0,0.5v6l9.146,9.146c0.098,0.098,0.226,0.146,0.354,0.146c0.128,0,0.256-0.049,0.354-0.146l5.793-5.793c0.195-0.195,0.195-0.512,0-0.707L6.5,0L6.5,0z"/>
      <circle cx="4" cy="4" r="1.25"/>
    </g>
  </svg>
))

i('Hue', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,1a7,7,0,1,0,7,7A7,7,0,0,0,8,1Zm5.975,6.5H11.95a3.973,3.973,0,0,0-1.54-2.674l1.01-1.75A6,6,0,0,1,13.975,7.5ZM8,11a3,3,0,1,1,3-3A3,3,0,0,1,8,11ZM8,2a5.954,5.954,0,0,1,2.553.578l-1,1.734a4.007,4.007,0,0,0-3.1,0l-1-1.734A5.954,5.954,0,0,1,8,2ZM4.58,3.077l1.01,1.75A3.973,3.973,0,0,0,4.05,7.5H2.025A6,6,0,0,1,4.58,3.077ZM2.025,8.5H4.05a3.973,3.973,0,0,0,1.54,2.674L4.58,12.923A6,6,0,0,1,2.025,8.5ZM8,14a5.953,5.953,0,0,1-2.553-.578l1-1.734a4.006,4.006,0,0,0,3.1,0l1,1.734A5.953,5.953,0,0,1,8,14Zm3.419-1.076-1.01-1.75A3.973,3.973,0,0,0,11.95,8.5h2.025A6,6,0,0,1,11.419,12.924Z"/>
    </g>
  </svg>
))

i('I', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="6 1 6 3 8 3 6 13 4 13 4 15 10 15 10 13 8 13 10 3 12 3 12 1 6 1"/>
    </g>
  </svg>
))

i('Import', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M16,10v5H1V10H2v4H15V10ZM12,6.707,11.293,6,9,8.293V0H8V8.293L5.707,6,5,6.707l3.5,3.5Z"/>
    </g>
  </svg>
))

i('Lift', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M7,1H8V16H7Zm7,1H9V3h5ZM9,12h7V11H9ZM9,5V6h7V5Zm5,3H9V9h5ZM9,15h5V14H9ZM3,10.293,1.707,9H6V8H1.707L3,6.707,2.293,6l-2.5,2.5,2.5,2.5Z"/>
    </g>
  </svg>
))

i('Link', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M12.5,13h-4a3.5,3.5,0,0,1,0-7h.408a1.4,1.4,0,0,1,0,1H8.5a2.5,2.5,0,0,0,0,5h4a2.5,2.5,0,0,0,0-5h-.547A4.394,4.394,0,0,0,12,6.5a4.394,4.394,0,0,0-.047-.5H12.5a3.5,3.5,0,0,1,0,7ZM0,6.5A3.5,3.5,0,0,0,3.5,10h.547A4.394,4.394,0,0,1,4,9.5,4.394,4.394,0,0,1,4.047,9H3.5a2.5,2.5,0,0,1,0-5h4a2.5,2.5,0,0,1,0,5H7.092a1.4,1.4,0,0,0,0,1H7.5a3.5,3.5,0,0,0,0-7h-4A3.5,3.5,0,0,0,0,6.5Z"/>
    </g>
  </svg>
))

i('List', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <rect x="1" y="3" width="14" height="1"/>
      <rect x="1" y="6" width="14" height="1"/>
      <rect x="1" y="9" width="14" height="1"/>
      <rect x="1" y="12" width="14" height="1"/>
    </g>
  </svg>
))

i('ListSmall', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <rect x="2" y="3" width="12" height="1"/>
      <rect x="2" y="6" width="12" height="1"/>
      <rect x="2" y="9" width="12" height="1"/>
      <rect x="2" y="12" width="12" height="1"/>
    </g>
  </svg>
))

i('Maze', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M16,0v15H9v-1h4v-2h1v2h1v-3h-3v2h-1V8h1v2h3V5h-4V4h4V1h-5v1h4v1H9V0H16z M5,13h5V8H5v1h4v3H6v-1h2v-1H4V7h9v2h1V6h-4V4H8V0H1v15h7v-1H4v-2H3v2H2V1h5v3H6V2H5v3h4v1H4V2H3v9h2V13L5,13z"/>
    </g>
  </svg>
))

i('Metadata', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M13,10c-0.947,0-1.781,0.447-2.331,1.133L6.818,8.994C6.929,8.681,7,8.35,7,8S6.929,7.319,6.818,7.006l3.851-2.139C11.219,5.552,12.053,6,13,6c1.657,0,3-1.343,3-3s-1.343-3-3-3s-3,1.343-3,3c0,0.35,0.071,0.681,0.182,0.994L6.331,6.133C5.781,5.448,4.947,5,4,5C2.343,5,1,6.343,1,8s1.343,3,3,3c0.947,0,1.781-0.447,2.331-1.133l3.851,2.139C10.071,12.319,10,12.65,10,13c0,1.657,1.343,3,3,3s3-1.343,3-3S14.657,10,13,10z M13,1c1.103,0,2,0.897,2,2c0,1.103-0.897,2-2,2s-2-0.897-2-2C11,1.897,11.897,1,13,1z M4,10c-1.103,0-2-0.897-2-2c0-1.103,0.897-2,2-2s2,0.897,2,2C6,9.103,5.103,10,4,10z M13,15c-1.103,0-2-0.897-2-2c0-1.103,0.897-2,2-2s2,0.897,2,2C15,14.103,14.103,15,13,15z"/>
    </g>
  </svg>
))

i('MinusCircle', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8.5,0A7.5,7.5,0,1,0,16,7.5,7.5,7.5,0,0,0,8.5,0Zm0,14A6.5,6.5,0,1,1,15,7.5,6.507,6.507,0,0,1,8.5,14ZM4,7h9V8H4Z"/>
    </g>
  </svg>
))

i('MinusCircles', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M3,4H8V5H3ZM2,4.5a3.5,3.5,0,1,1,6.92.733,5.465,5.465,0,0,1,1.027-.205A4.428,4.428,0,0,0,10,4.5,4.5,4.5,0,1,0,5.22,8.972a5.455,5.455,0,0,1,.391-.983C5.573,7.99,5.538,8,5.5,8A3.5,3.5,0,0,1,2,4.5Zm13,6A4.5,4.5,0,1,1,10.5,6,4.5,4.5,0,0,1,15,10.5Zm-1,0A3.5,3.5,0,1,0,10.5,14,3.5,3.5,0,0,0,14,10.5ZM8,10v1h5V10Z"/>
    </g>
  </svg>
))

i('Mirror', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M9,15H8V0H9ZM2.049,4.384v6.232L5.448,7.5l-3.4-3.116M1,2,7,7.5,1,13V2ZM16,13V2L10,7.5Z"/>
    </g>
  </svg>
))

i('New', (
  <svg width="16" height="18">
    <g className="line" fill="currentColor">
      <path d="M13,9.276V5.293L8.707,1H0V16H7.76A4.495,4.495,0,1,0,13,9.276ZM9,2.707,11.293,5H9ZM7.276,15H1V2H8V6h4V9.05A4.43,4.43,0,0,0,11.5,9a4.457,4.457,0,0,0-4.224,6ZM11.5,17A3.5,3.5,0,1,1,15,13.5,3.5,3.5,0,0,1,11.5,17ZM14,13v1H12v2H11V14H9V13h2V11h1v2Z"/>
    </g>
  </svg>
))

i('Note', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M15,10.707V0L1,0v16h8.707L15,10.707z M10,14.293V11h3.293L10,14.293z M14,10H9v5H2V1h12V10z"/>
      <rect x="4" y="10" width="3" height="1"/>
      <rect x="4" y="7" width="8" height="1"/>
      <rect x="4" y="4" width="8" height="1"/>
    </g>
  </svg>
))

i('NumberedList', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M1.427,14.147H4V15H.069v-.642l2.185-2.392a1.93,1.93,0,0,0,.664-1.241.888.888,0,0,0-.965-.884.925.925,0,0,0-.983.935v.052H.034V10.78A1.783,1.783,0,0,1,1.974,9,1.717,1.717,0,0,1,3.9,10.634,2.764,2.764,0,0,1,2.879,12.5L1.427,14.095ZM6,2V3H16V2Zm8,3H6V6h8ZM6,11H16V10H6Zm0,3h8V13H6ZM2,2V7H3V1H2L0,2.717v1L1.96,2Z"/>
    </g>
  </svg>
))

i('O', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,3.8a2.788,2.788,0,0,1,3,2.75v3.9A2.788,2.788,0,0,1,8,13.2a2.788,2.788,0,0,1-3-2.75V6.55A2.788,2.788,0,0,1,8,3.8ZM8,2A4.793,4.793,0,0,0,3,6.75v3.5A4.793,4.793,0,0,0,8,15a4.793,4.793,0,0,0,5-4.75V6.75A4.793,4.793,0,0,0,8,2Zm7-1V0H1V1Z"/>
    </g>
  </svg>
))

i('Photo', (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <g className="line" fill="currentColor">
      <path d="M12.5,3C13.327,3,14,3.673,14,4.5S13.327,6,12.5,6S11,5.327,11,4.5S11.673,3,12.5,3 M12.5,2C11.119,2,10,3.119,10,4.5S11.119,7,12.5,7S15,5.881,15,4.5S13.881,2,12.5,2L12.5,2z"/>
      <path d="M5.333,6.762l2.515,4.356L8.5,12.247l0.922-0.922l1.245-1.245L13.586,13h-2.919H5.333H1.732L5.333,6.762M5.333,4.762L0,14h5.333h5.333H16l-5.333-5.333l-1.952,1.952L5.333,4.762L5.333,4.762z"/>
    </g>
  </svg>
))

i('Plus', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="15 7 9 7 9 1 8 1 8 7 2 7 2 8 8 8 8 14 9 14 9 8 15 8 15 7"/>
    </g>
  </svg>
))

i('PlusCircle', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8.5,0A7.5,7.5,0,1,0,16,7.5,7.5,7.5,0,0,0,8.5,0Zm0,14A6.5,6.5,0,1,1,15,7.5,6.507,6.507,0,0,1,8.5,14ZM9,7h4V8H9v4H8V8H4V7H8V3H9Z"/>
    </g>
  </svg>
))

i('PlusCircles', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M5,7V5H3V4H5V2H6V4H8V5H6V7ZM2,4.5a3.5,3.5,0,1,1,6.92.733,5.465,5.465,0,0,1,1.027-.205A4.428,4.428,0,0,0,10,4.5,4.5,4.5,0,1,0,5.22,8.972a5.455,5.455,0,0,1,.391-.983C5.573,7.99,5.538,8,5.5,8A3.5,3.5,0,0,1,2,4.5Zm13,6A4.5,4.5,0,1,1,10.5,6,4.5,4.5,0,0,1,15,10.5Zm-1,0A3.5,3.5,0,1,0,10.5,14,3.5,3.5,0,0,0,14,10.5ZM11,10V8H10v2H8v1h2v2h1V11h2V10Z"/>
    </g>
  </svg>
))

i('Q', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M14,9.25V5.75A4.793,4.793,0,0,0,9,1,4.793,4.793,0,0,0,4,5.75v3.5A4.793,4.793,0,0,0,9,14a5.4,5.4,0,0,0,2.025-.393L12,15h2l-1.577-2.253A4.579,4.579,0,0,0,14,9.25ZM10.5,10h-2l1.444,2.063A3.51,3.51,0,0,1,9,12.2,2.788,2.788,0,0,1,6,9.45V5.55A2.788,2.788,0,0,1,9,2.8a2.788,2.788,0,0,1,3,2.75v3.9a2.627,2.627,0,0,1-.656,1.756Z"/>
      <rect x="1" y="1" width="1" height="14"/>
    </g>
  </svg>
))

i('Rotate', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M8,1A6.971,6.971,0,0,0,2,4.441V2H1V6H5V5H2.826a5.99,5.99,0,1,1,1.4,7.659l-.5.874A7,7,0,1,0,8,1Z"/>
    </g>
  </svg>
))

i('S', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M12.756,11.048C12.756,13.778,10.366,15,8,15c-2.8,0-4.754-1.646-4.754-4h2c0,1.477,1.423,2,2.754,2,.461,0,2.758-.094,2.758-1.952,0-1.182-.554-1.452-2.135-1.926L6.883,8.644A3.817,3.817,0,0,1,3.615,4.926C3.615,2.614,5.461,1,8.1,1c2.532,0,4.441,1.6,4.441,3.714h-2C10.546,3.721,9.52,3,8.1,3c-1.512,0-2.489.756-2.489,1.926,0,.8.3,1.381,1.791,1.787l1.788.493C10.612,7.631,12.756,8.272,12.756,11.048ZM3.074,7H0V8H3.765A4.076,4.076,0,0,1,3.074,7ZM11.4,7a4.844,4.844,0,0,1,1.281,1H16V7Z"/>
    </g>
  </svg>
))

i('Search', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M15.824,14.977L11.5,10.652C12.436,9.526,13,8.079,13,6.5C13,2.91,10.09,0,6.5,0S0,2.91,0,6.5S2.91,13,6.5,13c1.579,0,3.026-0.564,4.152-1.5l4.324,4.324C15.094,15.941,15.247,16,15.4,16s0.307-0.059,0.424-0.176C16.059,15.591,16.059,15.21,15.824,14.977z M6.5,11.8c-2.922,0-5.3-2.378-5.3-5.3s2.378-5.3,5.3-5.3s5.3,2.378,5.3,5.3S9.422,11.8,6.5,11.8z"/>
    </g>
  </svg>
))

i('Selection', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M0,1H4V2H1V4H0ZM1,6H0v4H1Zm0,6H0v3H4V14H1Zm14,2H12v1h4V12H15Zm0-4h1V6H15ZM12,1V2h3V4h1V1ZM6,2h4V1H6ZM6,15h4V14H6Z"/>
    </g>
  </svg>
))

i('SelectionOverlay', (
  <svg width="16" height="16">
    <path d="M4,1V2H1V4H0V1ZM1,6H0v4H1Zm0,6H0v3H4V14H1Zm14,2H12v1h4V12H15Zm0-4h1V6H15ZM12,1V2h3V4h1V1ZM6,2h4V1H6ZM6,15h4V14H6Z" fill="#fff"/>
    <path d="M4,2V3H2V4H1V2ZM2,6H1v4H2Zm0,6H1v2H4V13H2Zm4,2h4V13H6Zm8-1H12v1h3V12H14Zm0-3h1V6H14ZM12,2V3h2V4h1V2ZM6,3h4V2H6Z" opacity="0.5"/>
  </svg>
))

i('Sink', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M7,1H8V16H7Zm7,1H9V3h5ZM9,12h7V11H9ZM9,5V6h7V5Zm5,3H9V9h5ZM9,15h5V14H9ZM3,6.707,4.293,8H0V9H4.293L3,10.293,3.707,11l2.5-2.5L3.707,6Z"/>
    </g>
  </svg>
))

i('Sliders', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M12.95,4a2.5,2.5,0,0,0-4.9,0H0V5H8.05a2.5,2.5,0,0,0,4.9,0H16V4ZM10.5,6A1.5,1.5,0,1,1,12,4.5,1.5,1.5,0,0,1,10.5,6Zm-5,3a2.5,2.5,0,0,0-2.45,2H0v1H3.05a2.5,2.5,0,0,0,4.9,0H16V11H7.95A2.5,2.5,0,0,0,5.5,9Zm0,4A1.5,1.5,0,1,1,7,11.5,1.5,1.5,0,0,1,5.5,13Z"/>
    </g>
  </svg>
))

i('Spin', (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <g className="line" fill="none" stroke="currentColor">
      <path strokeWidth="1.5" d="M8,15c-3.866,0-7-3.134-7-7s3.134-7,7-7s7,3.134,7,7"/>
    </g>
  </svg>
))

i('Sub', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M11,2V4H7V14H5V4H1V2Zm1.427,12.147v-.052L13.879,12.5A2.764,2.764,0,0,0,14.9,10.634,1.717,1.717,0,0,0,12.974,9a1.783,1.783,0,0,0-1.94,1.78v.047h.935v-.052a.925.925,0,0,1,.983-.935.888.888,0,0,1,.965.884,1.93,1.93,0,0,1-.664,1.241l-2.185,2.392V15H15v-.853Z"/>
    </g>
  </svg>
))

i('Sun', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M12.776,6.609,15.6,5.467,15.23,4.54,12.413,5.678A4.958,4.958,0,0,0,10.4,3.628l1.187-2.8L10.666.441,9.483,3.227A4.992,4.992,0,0,0,8,3a4.992,4.992,0,0,0-1.39.223L5.467.4,4.54.77,5.682,3.6A4.944,4.944,0,0,0,3.637,5.6L.831,4.414l-.391.921L3.246,6.525a4.945,4.945,0,0,0-.023,2.865L.4,10.533l.375.927,2.817-1.138A4.958,4.958,0,0,0,5.6,12.372l-1.187,2.8.921.391,1.183-2.787A4.992,4.992,0,0,0,8,13a4.992,4.992,0,0,0,1.39-.223L10.533,15.6l.927-.375L10.318,12.4A4.944,4.944,0,0,0,12.363,10.4l2.806,1.191.391-.92L12.754,9.475A4.945,4.945,0,0,0,12.776,6.609ZM9.5,11.709h0A4,4,0,0,1,4.291,9.5h0A4,4,0,1,1,9.5,11.709Z"/>
    </g>
  </svg>
))

i('Sup', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M1,2H11V4H7V14H5V4H1ZM13.427,5.147V5.095L14.879,3.5A2.764,2.764,0,0,0,15.9,1.634,1.717,1.717,0,0,0,13.974,0a1.783,1.783,0,0,0-1.94,1.78v.047h.935V1.776a.925.925,0,0,1,.983-.935.888.888,0,0,1,.965.884,1.93,1.93,0,0,1-.664,1.241L12.069,5.358V6H16V5.147Z"/>
    </g>
  </svg>
))

i('Tag', (
  <svg width="16" height="16">
    <circle className="border" fill="currentColor" cx="8" cy="8" r="6"/>
    <circle className="color" fill="currentColor" cx="8" cy="8" r="5"/>
  </svg>
))

i('Tick', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M7,14a1,1,0,0,1-.8-.4l-3-4A1,1,0,1,1,4.8,8.4l2.152,2.87,5.216-7.825a1,1,0,0,1,1.664,1.11l-6,9a1,1,0,0,1-.8.445Z"/>
    </g>
  </svg>
))

i('Trash', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <path d="M13,14.542C13,14.79,12.729,15,12.409,15H4.591C4.271,15,4,14.79,4,14.542V4H3v10.542C3,15.346,3.714,16,4.591,16h7.818C13.286,16,14,15.346,14,14.542V4h-1V14.542z"/>
      <path d="M12,2V1c0-0.552-0.448-1-1-1H6C5.448,0,5,0.448,5,1v1H2v1h3h7h3V2H12z M6,2V1h5v1H6z"/>
      <rect x="6" y="5" width="1" height="8"/>
      <rect x="10" y="5" width="1" height="8"/>
    </g>
  </svg>
))

i('U', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <rect x="2" y="15" width="12" height="1"/>
      <path d="M8,14c-2.944,0-5-1.851-5-4.5V1H5V9.7c0,1.846,1.616,2.5,3,2.5s3-.654,3-2.5V1h2V9.5C13,12.149,10.944,14,8,14Z"/>
    </g>
  </svg>
))

i('XSmall', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="11.536 10.828 8.707 8 11.536 5.172 10.828 4.464 8 7.293 5.172 4.464 4.464 5.172 7.293 8 4.464 10.828 5.172 11.536 8 8.707 10.828 11.536 11.536 10.828"/>
    </g>
  </svg>
))

i('XMedium', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="12.95 3.757 12.243 3.05 8 7.293 3.757 3.05 3.05 3.757 7.293 8 3.05 12.243 3.757 12.95 8 8.707 12.243 12.95 12.95 12.243 8.707 8 12.95 3.757"/>
    </g>
  </svg>
))

i('XLarge', (
  <svg width="16" height="16">
    <g className="line" fill="currentColor">
      <polygon points="15.924 0.924 15.076 0.076 8 7.151 0.924 0.076 0.076 0.924 7.151 8 0.076 15.076 0.924 15.924 8 8.849 15.076 15.924 15.924 15.076 8.849 8 15.924 0.924"/>
    </g>
  </svg>
))


/* 20 x 20 */

i('Arrow', (
  <svg width="20" height="20">
    <g className="line" fill="currentColor">
      <path d="M6,4.273,14.429,12h-4.9l-.3.36L6,16.238V4.273M5,2V19l5-6h7L5,2Z"/>
    </g>
  </svg>
))


/* 24 x 24 */

i('Item', (
  <svg viewBox="0 0 24 24">
    <g className="line" fill="currentColor">
      <path d="M16.5,10c1.381,0,2.5-1.119,2.5-2.5C19,6.119,17.881,5,16.5,5S14,6.119,14,7.5C14,8.881,15.119,10,16.5,10z M16.5,6C17.327,6,18,6.673,18,7.5S17.327,9,16.5,9S15,8.327,15,7.5S15.673,6,16.5,6z"/>
      <path d="M14.667,11.667l-1.952,1.952L9.333,7.762L4,17h5.333h5.333H20L14.667,11.667z M9.333,16H5.732l3.601-6.238l2.515,4.356l0.652,1.129l0.922-0.922l1.245-1.245L17.586,16h-2.919H9.333z"/>
    </g>
  </svg>
))


/* 32 x 32 */

i('Book', (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <g className="line" fill="currentColor">
      <path d="M28,0H8A2,2,0,0,0,6.583.59h0l-4,4h0A1.993,1.993,0,0,0,2,6V30a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V6a2,2,0,0,0-2-2H4.584l3-3H28a1,1,0,0,1,1,1V27.722A1.992,1.992,0,0,0,30,26V2A2,2,0,0,0,28,0ZM25,6V30a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V6A1,1,0,0,1,4,5H24A1,1,0,0,1,25,6Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M28,0H8A2,2,0,0,0,6.583.59h0l-4,4h0A1.993,1.993,0,0,0,2,6V30a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V6a2,2,0,0,0-2-2H4.584l3-3H28a1,1,0,0,1,1,1V27.722A1.992,1.992,0,0,0,30,26V2A2,2,0,0,0,28,0Z"/>
    </g>
  </svg>
))

i('Project', (
  <svg width="32" height="32">
    <g className="line" fill="currentColor">
      <path d="M19,13h7V28H19V27h4V25h1v2h1V24H22v2H21V21h1v2h3V18H21V17h4V14H20v1h4v1H19ZM14,25H13v2H12V14h5v3H16V15H15v3h4v1H14V15H13v9h2v2h5V21H15v1h4v3H16V24h2V23H14V20h9v2h1V19H20V17H18V13H11V28h7V27H14ZM30,6.293V32H7V10H0V3H7V0H23.707ZM24,1.707V6h4.293ZM1,9H19V4H1ZM29,7H23V1H8V3H20v7H8V31H29Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M19,4V9H1V4ZM24,.293V6h5.707ZM30,7V32H7V10H20V3H7V0H23V7ZM18,27H14V25H13v2H12V14h5v3H16V15H15v3h4v1H14V15H13v9h2v2h5V21H15v1h4v3H16V24h2V23H14V20h9v2h1V19H20V17H18V13H11V28h7Zm8-14H19v3h5V15H20V14h5v3H21v1h4v5H22V21H21v5h1V24h3v3H24V25H23v2H19v1h7Z"/>
    </g>
  </svg>
))

i('Maze32', (
  <svg width="32" height="32" viewBox="0 0 32 32">
    <g className="line" fill="currentColor">
      <path d="M27,5V27H17V26h6V23h1v3h2V21H21v3H20V17h1v3h5V12H20V11h6V6H18V8h7V9H17V5ZM9,23H8v3H6V6h8v5H12V8H11v4h6v2H9V8H8V21h3v3h7V17H11v1h6v5H12V21h3V20H9V15H23v3h1V14H18V11H15V5H5V27H15V26H9ZM29,2a1,1,0,0,1,1,1V29a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V3A1,1,0,0,1,3,2H29m0-1H3A2,2,0,0,0,1,3V29a2,2,0,0,0,2,2H29a2,2,0,0,0,2-2V3a2,2,0,0,0-2-2Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M29,1H3A2,2,0,0,0,1,3V29a2,2,0,0,0,2,2H29a2,2,0,0,0,2-2V3A2,2,0,0,0,29,1ZM15,27H5V5H15v6h3v3h6v4H23V15H9v5h6v1H12v2h5V18H11V17h7v7H11V21H8V8H9v6h8V12H11V8h1v3h2V6H6V26H8V23H9v3h6Zm12,0H17V26h6V23h1v3h2V21H21v3H20V17h1v3h5V12H20V11h6V6H18V8h7V9H17V5H27Z"/>
    </g>
  </svg>
))

i('Plugin', (
  <svg width="32" height="32" viewBox="0 0 32 32">
    <g className="line" fill="currentColor">
      <path d="M29,7V3a1,1,0,0,0-1-1H20a1,1,0,0,0-1,1V7H13V3a1,1,0,0,0-1-1H4A1,1,0,0,0,3,3V7H0V30H32V7ZM20,3h8V7H20ZM4,3h8V7H4ZM31,29H1V8H31Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M19,6V3a1,1,0,0,1,1-1h8a1,1,0,0,1,1,1V6ZM0,7V30H32V7ZM13,6V3a1,1,0,0,0-1-1H4A1,1,0,0,0,3,3V6Z"/>
    </g>
  </svg>
))

i('Template', (
  <svg width="32" height="32">
    <g className="line" fill="currentColor">
      <path d="M21.707,0H2V32H30V8.293Zm6.586,8H22V1.707ZM29,31H3V1H21V9h8ZM8,27H24V24H8Zm1-2H23v1H9ZM8,21H24V18H8Zm1-2H23v1H9ZM8,15H24V12H8Zm1-2H23v1H9Zm9-7H8V9H18ZM17,8H9V7h8Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M23,20H9V19H23Zm0,5H9v1H23ZM9,8h8V7H9ZM22,.293V8h7.707ZM23,13H9v1H23Zm7-4V32H2V0H21V9ZM8,9H18V6H8ZM24,24H8v3H24Zm0-6H8v3H24Zm0-6H8v3H24Z"/>
    </g>
  </svg>
))

i('Tropy', (
  <svg width="32" height="32">
    <g className="line" fill="currentColor">
      <path d="M16,1A15,15,0,1,1,1,16,15.017,15.017,0,0,1,16,1m0-1A16,16,0,1,0,32,16,16,16,0,0,0,16,0Zm7.9,15,3.464-6H4.634L8.1,15H9.253L6.366,10H25.634l-2.309,4H13V28.366L19,24.9V18.747l-1,.577v5l-4,2.31V15Z"/>
    </g>
    <g className="block" fill="currentColor">
      <path d="M16,0A16,16,0,1,0,32,16,16,16,0,0,0,16,0Zm7.9,15H14V26.634l4-2.31v-5l1-.577V24.9l-6,3.465V14H23.325l2.309-4H6.366l2.886,5H8.1L4.634,9H27.366Z"/>
    </g>
  </svg>
))
