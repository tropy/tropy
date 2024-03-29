import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args'
import { create } from '../stores/about'
import { Main } from '../components/main'
import { About } from '../components/about'
import { intl } from '../actions'
import win from '../window'

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
