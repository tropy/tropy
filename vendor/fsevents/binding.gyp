{
  "conditions": [
    ['OS=="mac"', {
      "targets": [{
        "target_name": "fsevents",
        "sources": [ "src/fsevents.c"],
        "xcode_settings": {
          "OTHER_CFLAGS": [
            "-arch x86_64",
            "-arch arm64"
          ],
          "OTHER_LDFLAGS": [
            "-Wl,-bind_at_load",
            "-framework CoreFoundation -framework CoreServices",
            "-arch x86_64",
            "-arch arm64"
          ]
        }
      }, {
        "target_name": "action_after_build",
        "type": "none",
        "dependencies": ["fsevents"],
        "copies": [{
          "files": ["<(PRODUCT_DIR)/fsevents.node"],
          "destination": "./"
        }]
      }]
    }]
  ]
}
