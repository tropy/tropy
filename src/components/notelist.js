'use strict'

const React = require('react')

const NoteList = () => (
  <ul className="note-list">
    <li className="note active">
      Denver, Colorado Dec. 24th, 1899.<br/>Mr. Wm. A. Pinkerton, …
    </li>
    <li className="note">
      Name in full: H. Frank Clark<br/>Age: 31 …
    </li>
    <li className="note">
      Dear Sir: -<br/>I am in receipt of yours of the 16th …
    </li>
  </ul>
)

module.exports = { NoteList }