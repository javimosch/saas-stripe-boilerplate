/**
 * Synchronously loads all .js files in the specified directory.
 *
 * @param {string} modelsDir - The directory containing the models.
 */
function loadModelsSync(modelsDir) {
    const fs = require('fs');
    const path = require('path');

    // Read all files in the models directory
    fs.readdirSync(modelsDir).forEach(file => {
        // Only include .js files
        if (file.endsWith('.js')) {
            require(path.join(modelsDir, file));
            console.log(`Model ${file} loaded`)
        }
    });
}

module.exports = loadModelsSync