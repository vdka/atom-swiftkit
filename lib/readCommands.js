'use babel'

import fs from 'fs'
import yaml from 'js-yaml'

var didWarn = false
export function readCompileCommands(filePath: string, omitSources: bool): Array<string> {

  // TODO(vdka): read whatever is latest 'debug.yaml' | 'release.yaml'
  let debugYaml = atom.project.getDirectories()[0].path + '/.build/debug.yaml'

  var yamlContents
  try {
    let data = fs.readFileSync(debugYaml, 'utf8')
    if (!data) { return new Array() }

    yamlContents = yaml.safeLoad(data)
  } catch (err) {
    if (err.code == 'ENOENT') {
      if (didWarn) { return new Array() }
      else { didWarn = true }
      atom.notifications.addInfo("Project needs to be built through SwiftPM for autocomplete to work", { dismissable: true })

      return new Array()
    }
  }

  didWarn = false

  for (let moduleKey in yamlContents['commands']) {

    let module = yamlContents['commands'][moduleKey]

    if (!module.sources) { continue }
    if (!module.sources.includes(filePath)) { continue }

    if (!module['import-paths']) { continue }
    if (!module['other-args']) { continue }

    if (omitSources) {
      return module['other-args'].concat(["-I"]).concat(module['import-paths'])
    } else {
      return module['sources'].concat(module['other-args']).concat(["-I"]).concat(module['import-paths'])
    }
  }

  return new Array()
}
