const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('activeClassName="active"')) {
                // Replace both exact activeClassName="active" and activeClassName="active"
                content = content.replace(/ activeClassName="active"/g, '');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Done.');
