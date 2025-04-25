import { existsSync, readdirSync, renameSync } from 'fs';
import { join } from 'path';

const deal = async (ignoreControl) => {

  console.log(`bakxml: ${ignoreControl}`);
  const controls = readdirSync('.');
  for (let i = controls.length - 1; i >= 0; i--) {
    if (controls[i] === ignoreControl) {
      controls.splice(i, 1);
      continue;
    }
    if (!existsSync(join('.', controls[i], 'ControlManifest.Input.xml'))) {
      controls.splice(i, 1);
    }
  }

  console.log(`all controls: ${controls}`);

  for (const element of controls) {
    if (existsSync(join('.', element, 'ControlManifest.Input.xml'))) {
      try {
        renameSync(join('.', element, 'ControlManifest.Input.xml'), join('.', element, 'ControlManifest.Input.xml.bak'))
      } catch { /* empty */ }
    }
  }
}

export { deal };
