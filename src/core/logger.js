const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = LOG_LEVELS[level];
  }
}

function formatMessage(level, module, message, data = null) {
  const timestamp = new Date().toISOString();
  const baseMsg = `[${timestamp}] [${level}] [${module}] ${message}`;
  return data ? `${baseMsg} ${JSON.stringify(data)}` : baseMsg;
}

function debug(module, message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', module, message, data));
  }
}

function info(module, message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    console.log(formatMessage('INFO', module, message, data));
  }
}

function warn(module, message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', module, message, data));
  }
}

function error(module, message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', module, message, data));
  }
}

module.exports = {
  LOG_LEVELS,
  setLogLevel,
  debug,
  info,
  warn,
  error
};
