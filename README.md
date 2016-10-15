# Autocomplete for Swift

![](https://cloud.githubusercontent.com/assets/7651280/19410079/3955b088-9326-11e6-96a1-4c9b124793bd.png)

Provides completion for Swift using [sourcekitten](https://github.com/jpsim/SourceKitten) and Swift Package Manager.

## How to use

### Install using APM (or through atom's UI)
```
apm install swiftkit
```

### Install `sourcekitten`
```
brew install sourcekitten
```

### Build your project
```
swift build
```

## Limitations
Currently `sourcekitten` only has support for macOS, support for Linux is on its [way](https://github.com/jpsim/SourceKitten/pull/268)

Currently only has support for project's with a SwiftPM generated build file.
This mean's there is no completion for app development.

## Goals
- [ ] Syntax highlighting with or without sourcekitten depending on performance
- [ ] Support Swift without of SwiftPM (Xcode app's and Swift scripts)
- [ ] Building and Testing through SwiftPM
- [ ] Debugging support.
- [ ] Documentation lookup through atom's completion _more_ button. (link to SwiftDoc.org)
- [ ] Filter lookup by checking the current files imports. Currently every dependency file is included in the search.

## Prior works

All possible thanks to [SourceKitten](https://github.com/jpsim/SourceKitten)
Facebook's nuclide provided the initial groundwork with [this](https://github.com/facebook/nuclide/pull/632).
