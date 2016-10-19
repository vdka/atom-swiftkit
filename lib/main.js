'use babel'

import {Point, Range} from 'atom'
import {readCompileCommands} from './readCommands'
import {asyncExecuteSourceKitten} from './sourcekitten'
import {sourceKittenCompletionToAtomSuggestion} from './complete'
import {activateLinter, deactivateLinter} from './linter'
import Fuse from 'fuse.js'

export {provideLinter} from './linter'

export function activate() {
  activateLinter()
}

export function deactivate() {
  deactivateLinter()
}

export function createAutocompleteProvider(): atom$AutocompleteProvider {
  return {
    selector: '.source.swift',
    disableForSelector: '.source.swift .comment',
    excludeLowerPriority: true,
    inclusionPriority: 1,
    getSuggestions(request: atom$AutocompleteRequest): Promise<?Array<atom$AutocompleteSuggestion>> {

      let filePath = request.editor.getPath()

      let compilerArgs = readCompileCommands(filePath)

      let offset = request.editor.getBuffer().characterIndexForPosition(request.bufferPosition) - request.prefix.length

      let cmd = ['sourcekitten', 'complete'].concat([
        '--text', "'" + request.editor.getText() + "'",
        '--offset', String(offset),
        '--'
      ].concat(compilerArgs)).join(' ')

      return asyncExecuteSourceKitten('complete', [
        '--text', "'" + request.editor.getText() + "'",
        '--offset', String(offset),
        '--'
      ].concat(compilerArgs)).then( (result) => {

        if (!result) { return [] }

        let json = JSON.parse(result)

        // Case Insensitive search if there are any uppercase characters
        let hasUppercase = request.prefix.match(/[A-Z]/) != null
        let threshhold = atom.config.get("swiftkit.completionMatchThreshhold")
        var fuse = new Fuse(json, { shouldSort: true, caseSensitive: hasUppercase, threshhold: threshhold, keys: ["name"] })

        var sortedMatches = fuse.search(request.prefix)

        return sortedMatches.map(sourceKittenCompletionToAtomSuggestion)
      })
    },
    onDidInsertSuggestion(arg) {
      let editor = arg.editor
      let suggestion = arg.suggestion
      let triggerPosition = arg.triggerPosition

      // The following will clean up the way sourcekitten is smart about suggestion's on optional's
      // and it's ability to provide a call using optional chaining.
      // It also clean's up other misc issues with dot member accessing
      // NOTE(vdka): do we do this for all of the cursors? How does multiline suggestion's work...
      if (suggestion.snippet.startsWith('.')) {

        let line = editor.getCursors()[0].getCurrentBufferLine()

        let re = /\.\./g

        var match
        var lastIndex = 0
        while ((match = re.exec(line)) != null) {
          lastIndex = match.index
          if (match.index >= triggerPosition.column) { break }
        }
        var point = triggerPosition
        point.column = lastIndex
        let buffer = editor.getBuffer()
        let range = new Range(point, new Point(point.row, point.column + 1))
        buffer.delete(range)
      } else if (suggestion.snippet.startsWith('?.')) {

        let line = editor.getCursors()[0].getCurrentBufferLine()

        let re = /\.\?\./g

        var match
        var lastIndex = 0
        while ((match = re.exec(line)) != null) {
          lastIndex = match.index
          if (match.index >= triggerPosition.column) { break }
        }
        var point = triggerPosition
        point.column = lastIndex
        let buffer = editor.getBuffer()
        let range = new Range(point, new Point(point.row, point.column + 1))
        buffer.delete(range)
      }
    }
  }
}
