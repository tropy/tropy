import { app } from 'electron'

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('enable-unsafe-swiftshader')
