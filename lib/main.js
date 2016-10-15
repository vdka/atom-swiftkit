'use babel'

import {Point, Range} from 'atom'
import {SourceKittenCompletion, sourceKittenCompletionToAtomSuggestion} from './complete'
import {asyncExecuteSourceKitten} from './sourcekitten'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Fuse from 'fuse.js'

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

      let cmd = ['sourcekitten complete '].concat([
        '--text', '"' + request.editor.getText() + '"',
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
        var fuse = new Fuse(json, { shouldSort: true, caseSensitive: hasUppercase, threshhold: 0.5, keys: ["name"] })

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

var didWarn = false
function readCompileCommands(filePath: string): Array<string> {

  // TODO(vdka): read whatever is latest 'debug.yaml' | 'release.yaml'
  let debugYaml = atom.project.getDirectories()[0].path + '/.build/debug.yaml'

  let sources = new Array()
  let otherArgs = new Array()
  let compileCommands = new Map()

  var yamlContents
  try {
    let data = fs.readFileSync(debugYaml, 'utf8')
    if (!data) { return compileCommands }

    yamlContents = yaml.safeLoad(data)
  } catch (err) {
    if (err.code == 'ENOENT') {
      if (didWarn) { return compileCommands }
      else { didWarn = true }
      atom.notifications.addInfo("Project needs to be built through SwiftPM for autocomplete to work", { dismissable: true })

      return compileCommands
    }
  }

  didWarn = false

  for (let commandKey in yamlContents.commands) {
    let command = yamlContents.commands[commandKey]

    // if this command doesn't have a source, it's not important for sourcekitten
    if (!command.sources) { continue }

    sources = sources.concat(command.sources)

    if (command.sources.includes(filePath)) {
      otherArgs = command['other-args'] || []
    }
  }

  return otherArgs.concat(['-I','/Users/Ethan/Sources/vdka/cj/.build/debug']).concat(sources)
}
