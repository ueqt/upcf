import { existsSync, readdirSync, renameSync } from 'fs';
import { join } from 'path';

const deal = async () => {

  console.log(`fixxml`);
  const controls = readdirSync('.');
  for (let i = controls.length - 1; i >= 0; i--) {
    if (!existsSync(join('.', controls[i], 'ControlManifest.Input.xml.bak'))) {
      controls.splice(i, 1);
    }
  }

  console.log(`all controls: ${controls}`);

  for (const element of controls) {
    if (existsSync(join('.', element, 'ControlManifest.Input.xml.bak'))) {
      try {
        renameSync(join('.', element, 'ControlManifest.Input.xml.bak'), join('.', element, 'ControlManifest.Input.xml'))
      } catch { /* empty */ }
    }
  }

  if (existsSync(join('.', '.envs', '.env.dev.bak'))) {
    renameSync(join('.', '.envs', '.env.dev.bak'), join('.', '.envs', '.env.dev'));
  }
}

export { deal };
