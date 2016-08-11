'use strict'

const React = require('react')

const NoteList = () => (
  <ul className="note-list">
    <li className="note active">
      <div className="css-multiline-truncate">
        Denver, Colorado Dec. 24th, 1899.<br/>
        Mr. Wm. A. Pinkerton,<br/>
        Chicago, Illinois
      </div>
    </li>
    <li className="note">
      <div className="css-multiline-truncate">
        Name in full: H. Frank Clark<br/>
        Age: 31<br/>
        Height: 5-11 3/4
      </div>
    </li>
    <li className="note">
      <div className="css-multiline-truncate">
        I am in receipt of yours of the 16th inst. enclosing Application and
        History of H. Frank Cary, which I have read over very carefully and note
        his references have been run down very carefully in Chicago and that
        every person seen gives him a first class character and seem to be very
        honest about it.
      </div>
    </li>
  </ul>
)

module.exports = { NoteList }