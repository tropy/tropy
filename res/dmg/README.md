# DMG layout

`scripts/pack.js` builds the macOS DMG with `hdiutil`.
The window layout comes from `<channel>.DS_Store`
(`latest`, `beta`, `alpha`),
which is copied into the volume as `.DS_Store`.
The background is `.background/background.tiff`,
made from `background.png` and `background@2x.png` on every build.

Changing only the background images needs no new `.DS_Store`.

Each `.DS_Store` stores the volume name and the app name
(Tropy, Tropy Beta, Tropy Alpha),
so there is one per channel and each must be edited
on a volume with the matching names.

Current layout: window 720×460 at 100,100
(no toolbar, sidebar, path or status bar), icon size 92,
app at 216,206, Applications at 504,206.

## Editing in Finder

1. Make a writable volume for one channel,
   starting from the current layout.
   Use a real app bundle: Finder does not save
   the position of an empty `.app` folder.
   Any built Tropy app will do, it is copied under the channel's name.

   ```sh
   P="Tropy Beta"  # Tropy | Tropy Beta | Tropy Alpha
   C=beta          # latest | beta | alpha
   APP="dist/Tropy Beta-darwin-arm64/Tropy Beta.app"
   S=$(mktemp -d)/layout

   mkdir -p "$S/.background"
   ditto "$APP" "$S/$P.app"
   ln -s /Applications "$S/Applications"
   tiffutil -cathidpicheck res/dmg/background.png res/dmg/background@2x.png \
     -out "$S/.background/background.tiff"
   cp "res/dmg/$C.DS_Store" "$S/.DS_Store"
   hdiutil create -srcfolder "$S" -volname "$P" -fs HFS+ -format UDRW "$S.dmg"
   open "$S.dmg"
   ```

2. Open the volume in Finder and make the changes:
   - Icon positions: drag the icons.
   - Window size: drag the window edge.
   - Icon size, text size, background:
     View → Show View Options (⌘J).
     To pick a new background picture, drag
     `.background/background.tiff` into the picture well
     (⌘⇧. shows hidden files).
   - Toolbar, sidebar, path bar, status bar: View menu.

   For exact values, use AppleScript instead of dragging:

   ```sh
   osascript -e "tell application \"Finder\"
     set bounds of container window of disk \"$P\" to {100, 100, 820, 560}
     set position of item \"$P.app\" of disk \"$P\" to {216, 206}
     set position of item \"Applications\" of disk \"$P\" to {504, 206}
   end tell"
   ```

3. Close the window and wait a few seconds:
   Finder writes `.DS_Store` with a delay.
   Then eject, mount again and check that both icon positions are there
   (`Iloc` records, x and y as 4-byte hex after `0000 0010`,
   e.g. `0000 00d8 0000 00ce` is 216,206):

   ```sh
   diskutil eject "/Volumes/$P"
   open "$S.dmg"
   xxd "/Volumes/$P/.DS_Store" | grep -A1 Iloc
   ```

4. Copy it back and eject:

   ```sh
   cp "/Volumes/$P/.DS_Store" "res/dmg/$C.DS_Store"
   diskutil eject "/Volumes/$P"
   ```

5. Repeat for the other channels,
   then build a DMG (`npm run pack -- dmg`) and check it in Finder.
