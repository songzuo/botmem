/**
 * SSH Utility Module for Commander Scripts
 *
 * Provides shared SSH connection functionality with consistent error handling,
 * connection pooling, and standardized output formatting.
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Default server configuration
const defaultServerConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000,
  compress: true
};

// Load configuration from file if available
function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      return { ...defaultServerConfig, ...config };
    }
  } catch (error) {
    console.warn('Warning: Failed to load config.json, using defaults');
  }
  return defaultServerConfig;
}

/**
 * Create and execute a single SSH command
 * @param {string} command - Command to execute
 * @param {function} callback - Callback with (error, output)
 * @param {object} customConfig - Optional custom SSH config
 */
function execCommand(command, callback, customConfig = null) {
  const conn = new Client();
  const config = customConfig || loadConfig();

  conn.on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) {
        conn.end();
        return callback(err, null);
      }

      let output = '';
      let errorOutput = '';

      stream.on('data', (data) => {
        output += data.toString();
      });

      stream.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      stream.on('close', () => {
        conn.end();
        callback(null, { output, errorOutput });
      });
    });
  }).on('error', (err) => {
    callback(err, null);
  }).connect(config);
}

/**
 * Execute multiple commands in sequence
 * @param {string[]} commands - Array of commands to execute
 * @param {function} callback - Callback with (error, results[])
 * @param {object} customConfig - Optional custom SSH config
 */
function execCommands(commands, callback, customConfig = null) {
  const results = [];
  let index = 0;

  function runNext() {
    if (index >= commands.length) {
      callback(null, results);
      return;
    }

    execCommand(commands[index], (err, result) => {
      results.push({ command: commands[index], error: err, result });
      index++;
      runNext();
    }, customConfig);
  }

  runNext();
}

/**
 * Execute commands in parallel (separate connections)
 * @param {string[]} commands - Array of commands to execute
 * @param {function} callback - Callback with (error, results[])
 * @param {object} customConfig - Optional custom SSH config
 */
function execCommandsParallel(commands, callback, customConfig = null) {
  let completed = 0;
  const results = [];

  commands.forEach((cmd, i) => {
    execCommand(cmd, (err, result) => {
      results[i] = { command: cmd, error: err, result };
      completed++;

      if (completed === commands.length) {
        callback(null, results);
      }
    }, customConfig);
  });
}

/**
 * Create an SSH connection for manual control
 * @param {object} customConfig - Optional custom SSH config
 * @returns {Client} SSH client instance
 */
function createConnection(customConfig = null) {
  const conn = new Client();
  const config = customConfig || loadConfig();

  conn.connect(config);
  return conn;
}

/**
 * Standardized header printing
 * @param {string} title - Header title
 */
function printHeader(title) {
  const line = '='.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

/**
 * Standardized section printing
 * @param {string} title - Section title
 */
function printSection(title) {
  console.log(`\n--- ${title} ---`);
}

/**
 * Standardized error printing
 * @param {string} message - Error message
 * @param {Error} error - Error object (optional)
 */
function printError(message, error = null) {
  console.error(`✗ ${message}`);
  if (error) {
    console.error(`  ${error.message}`);
  }
}

/**
 * Standardized success printing
 * @param {string} message - Success message
 */
function printSuccess(message) {
  console.log(`✓ ${message}`);
}

/**
 * Standardized warning printing
 * @param {string} message - Warning message
 */
function printWarning(message) {
  console.warn(`⚠ ${message}`);
}

module.exports = {
  defaultServerConfig,
  loadConfig,
  execCommand,
  execCommands,
  execCommandsParallel,
  createConnection,
  printHeader,
  printSection,
  printError,
  printSuccess,
  printWarning
};
