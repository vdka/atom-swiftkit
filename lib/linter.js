'use babel'

import {CompositeDisposable} from 'atom'

let helpers = null
let executablePath

let additionalFlags

const lint = (editor, command) => {

  if (!helpers) {
    helpers = require('atom-linter')
  }

  // const regex = /^(.*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$/g
  const regex = '(?<file>.+):(?<line>\\d+):(?<col>\\d+):\\s(?<type>warning|error):\\s(?<message>.+)'
  const file = editor.getPath()
  const text = editor.getText()

  return helpers.exec(command, ['build'].concat(additionalFlags), { cwd: atom.project.getPaths()[0], stream: 'both' }).then( (output) => {

    if (editor.getText() !== text) { return null } // Editor contents changed, tell Linter not to update

    const stdoutWarnings = helpers.parse(output.stdout, regex).map( (parsed) => {
      const message = Object.assign({}, parsed)
      const line = message.range[0][0]
      const col = message.range[0][1]
      message.range = helpers.rangeFromLineNumber(editor, line, col)
      return message
    })

    const stderrWarnings = helpers.parse(output.stderr, regex).map( (parsed) => {
      const message = Object.assign({}, parsed)
      const line = message.range[0][0]
      const col = message.range[0][1]
      message.range = helpers.rangeFromLineNumber(editor, line, col)
      return message
    })

    return stdoutWarnings.concat(stderrWarnings)
  })
}

export default {
  activateLinter() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('swiftkit.toolchainPath', (value) => {

        const swiftPath = value + '/usr/bin/swift'
        executablePath = swiftPath;
      })
    );
    this.subscriptions.add(
      atom.config.observe('swiftkit.swiftPMFlags', (value) => {

        if (value.match(/^\s*$/)) { return }

        additionalFlags = value.split(' ')
      })
    )
  },

  deactivateLinter() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      grammarScopes: ['source.swift'],
      scope: 'project',
      lintOnFly: false,
      name: 'swiftkit-lint',
      lint: editor => lint(editor, executablePath),
    };
  },
};
