const { app } = require('electron')
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer')
