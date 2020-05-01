const fs = require('fs');

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

package.main = 'app.js';

fs.writeFileSync('dist/package.json', JSON.stringify(package, null, '\t'));
