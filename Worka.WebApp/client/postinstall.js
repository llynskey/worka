const { copyFile, readFile, writeFile } = require('fs').promises;

function log(...args) {
  console.log('[react-native-maps]', ...args);
}

async function createReactNativeMapsWebShim() {
  const modulePath = 'node_modules/react-native-maps';

  log('Creating web compatibility shim.');
  await writeFile(`${modulePath}/lib/index.web.js`, 'module.exports = {}', 'utf-8');
  await copyFile(`${modulePath}/lib/index.d.ts`, `${modulePath}/lib/index.web.d.ts`);

  //const pkg = JSON.parse(await readFile(`${modulePath}/package.json`, 'utf-8'));
  //pkg['react-native'] = 'lib/index.js';
  //pkg.main = 'lib/index.web.js';

  //await writeFile(`${modulePath}/package.json`, JSON.stringify(pkg, null, 2), 'utf-8');
  log('Web compatibility shim ready.');
}

createReactNativeMapsWebShim().catch((error) => {
  console.warn('[react-native-maps] Web shim skipped:', error.message);
});
