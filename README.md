## Proxmate for Chrome

Extension store version here - https://chrome.google.com/webstore/detail/proxmate/ifalmiidchkjjmkkbkoaibpmoeichmki

## Building

Proxmate is using grunt for building. To build a dist file (completely minified through googles clojurecompiler, cssmin and htmlmin) run `grunt build`.

Development and live reloading is available through `grunt serve`.

To build a non-minified version, run `grunt src`.