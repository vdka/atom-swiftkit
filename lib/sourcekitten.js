'use babel'

import {asyncExecute} from './execute'

export async function asyncExecuteSourceKitten(command: String, args: Array<string>): Promise<?string> {
  // https://github.com/jpsim/SourceKitten/pull/223 tracks Linux support
  if (process.platform !== 'darwin') { return null }

  const sourceKittenPath = atom.config.get('swiftkit.sourceKittenPath')
  const result = await asyncExecute(sourceKittenPath, [command].concat(args))
  if (result.exitCode == null) {
    const errorCode = result.errorCode ? result.errorCode : ''
    const errorMessage = result.errorMessage ? result.errorMessage : ''
    atom.notifications.addError(`Could not invoke SourceKitten at path \`${sourceKittenPath}\``, {
      description:
        'Please double-check that the path you have set for the ' +
        '`swiftkit.sourceKittenPath` config setting is correct.<br>' +
        `**Error code:** \`${errorCode}\`<br>` +
        `**Error message:** <pre>${errorMessage}</pre>`,
    })
    return null
  } else if (result.exitCode !== 0 || result.stdout.length === 0) {
    atom.notifications.addError('An error occured when invoking SourceKitten', {
      description:
        'Please file a bug.<br>' +
        `**exit code:** \`${String(result.exitCode)}\`<br>` +
        `**stdout:** <pre>${String(result.stdout)}</pre><br>` +
        `**stderr:** <pre>${String(result.stderr)}</pre><br>` +
        `**command:** <pre>${String(result.command ? result.command : '')}</pre><br>`,
    })
    return null
  }

  return result.stdout
}
