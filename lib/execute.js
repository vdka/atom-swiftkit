'use babel'

import child_process from 'child_process'

var existingChildren = new Map();

export async function asyncExecute(command: string, args: Array<string>, options?: AsyncExecuteOptions = {}): Promise<AsyncExecuteReturn> {
  return new Promise((resolve, reject) => {
    const existingChild = existingChildren.get(command)
    if (existingChild) {
      existingChild.kill('SIGINT')
    }
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
        existingChildren.delete(command)
        resolve({ stdout, stderr, exitCode: 0 })
      },
    )
    existingChildren.set(command, process)
    if (typeof options.stdin === 'string' && process.stdin != null) {
      process.stdin.write(options.stdin)
      process.stdin.end()
    }
  })
}
