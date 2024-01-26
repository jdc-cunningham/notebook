### About

Tracking freelance jobs and gamifying intent to make money

<img src="./app-screenshot.JPG"/>

<img src="./drag-drop-demo.gif"/>

### Tech

Uses ReactJS for the front end with ElectronJS wrapper for deskto app.

API is NodeJS/ExpressJS with mysql2

### Problems

The caret is problematic on the `contentEditable` specifically when the state updates/repaints the content, the caret position goes to the beginning most times. I think a different approach is to use no coupled-state-rendering where data is still maintained on change but not painted by state.

The main issue is the range stuff and dom targets (nesting divs).

### Misc

Icons from uxwing

### Generating electron icon for Mac

This was a PITA for some reason but iconutil is built into mac (doing this on Monterey)

See [here](https://stackoverflow.com/questions/29293840/how-to-use-iconutil-on-mac-to-generate-icns-file) for more info
