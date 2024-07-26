/**
 * Injects all functions from .js files in a specified directory into the global namespace.
 *
 * @param {string} globalsDir - The directory containing the global functions.
 */
function injectGlobals(globalsDir) {
    const fs = require('fs');
    const path = require('path');
  
    // Read all files in the specified directory
    fs.readdirSync(globalsDir).forEach(file => {
      if (file.endsWith('.js')) {
        const functionName = path.basename(file, '.js');
        global[functionName] = require(path.join(globalsDir, file));
        console.log(`Global ${functionName} loaded`)
      }
    });
  }
  
  module.exports = injectGlobals;