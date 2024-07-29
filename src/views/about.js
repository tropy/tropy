import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args.js'
import { create } from '../stores/about.js'
import { Main } from '../components/main.js'
import { About } from '../components/about.js'
import { intl } from '../actions/index.js'
import win from '../window.js'

export const store = create()
const { locale } = ARGS

store
  .dispatch(intl.load({ locale }))
  .then(() => {
    createRoot(document.getElementById('main'))
      .render(
        <Main store={store} window={win}>
          <About/>
        </Main>
      )
  })
