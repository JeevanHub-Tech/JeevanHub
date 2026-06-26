const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const routesDir = path.join(__dirname, 'backend', 'routes');

const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('Controller.js'));

console.log("=== Checking for missing routes ===");
for (const cFile of controllerFiles) {
    const cContent = fs.readFileSync(path.join(controllersDir, cFile), 'utf-8');
    const exportsRegex = /exports\.([a-zA-Z0-9_]+)\s*=/g;
    let match;
    const exportedMethods = [];
    while ((match = exportsRegex.exec(cContent)) !== null) {
        exportedMethods.push(match[1]);
    }

    const routeFile = cFile.replace('Controller', 'Routes');
    const rPath = path.join(routesDir, routeFile);
    if (fs.existsSync(rPath)) {
        const rContent = fs.readFileSync(rPath, 'utf-8');
        for (const method of exportedMethods) {
            if (!rContent.includes(method)) {
                console.log(`Missing method in ${routeFile}: ${method}`);
            }
        }
    } else {
        console.log(`Route file not found for ${cFile}`);
    }
}

console.log("\n=== Checking for public routes with auth ===");
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
for (const rFile of routeFiles) {
    const lines = fs.readFileSync(path.join(routesDir, rFile), 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('public') && !lines[i].toLowerCase().includes('not public')) {
            // Check next few lines for 'auth' middleware
            for (let j = i; j < Math.min(i + 3, lines.length); j++) {
                if (lines[j].includes('router.') && lines[j].includes(', auth,') || lines[j].includes(' auth,')) {
                    console.log(`Potential public route with auth in ${rFile}: Line ${j + 1}`);
                }
            }
        }
    }
}
