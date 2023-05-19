const debug = require('debug')('cache-memory')

/**
 * Logs a debug message
 * @param message to log
 * @param loggingObj Object to log details about
 */
export const log = (message:string, loggingObj?:any) => {
  if (!debug.enabled) return

  if (loggingObj !== undefined && typeof loggingObj === 'object') {
    let toLog = message;

    Object.keys(loggingObj).forEach(key => {
      toLog += `, ${key}: ${JSON.stringify(loggingObj[key])}`
    })

    debug(toLog);
  } else {
    debug(message);
  }
}
