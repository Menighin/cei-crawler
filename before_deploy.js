const fs = require('fs');

// Copying and modifying package
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

package.main = 'app.js';

fs.writeFileSync('dist/package.json', JSON.stringify(package, null, '\t'));

// Copying README file
fs.writeFileSync('dist/README.md', fs.readFileSync('README.md'));
