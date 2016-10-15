'use babel'

import child_process from 'child_process'

export async function asyncExecute(command: string, args: Array<string>, options?: AsyncExecuteOptions = {}): Promise<AsyncExecuteReturn> {
  return new Promise((resolve, reject) => {
    const process = child_process.execFile(command, args, { maxBuffer: 100 * 1024 * 1024, ...options, },
      (err, stdoutBuf, stderrBuf) => {
        const stdout = stdoutBuf.toString('utf8')
        const stderr = stderrBuf.toString('utf8')
        if (err != null) {
          if (Number.isInteger(err.code)) {
            resolve({ stdout, stderr, exitCode: err.code })
          } else {
            resolve({ stdout, stderr, errorCode: err.errno || 'EUNKNOWN', errorMessage: err.message })
          }
        }
        resolve({ stdout, stderr, exitCode: 0 })
      },
    )
    if (typeof options.stdin === 'string' && process.stdin != null) {
      process.stdin.write(options.stdin)
      process.stdin.end()
    }
  })
}

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
