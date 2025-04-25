import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import shelljs from 'shelljs';
import * as fixxml from '../fixxml/deal';

const deal = async (prefix, control, isGlobal = false) => {

  console.log(`push: prefix: ${prefix}; control: ${control}; isGlobal: ${!!isGlobal}`);

  const buildContext = readFileSync('./node_modules/pcf-scripts/buildContext.js', { encoding: 'utf8' });
  let datas = buildContext.split('\n');
  let foundIndex = datas.findIndex(p => p.includes(`static findControlFolders(cwd, excludedFolders) {`));
  if (foundIndex >= 0) {
    datas[foundIndex] = `static findControlFolders(cwd, excludedFolders) { return ['${control}'];`;
    writeFileSync('./node_modules/pcf-scripts/buildContext.js', datas.join('\n'), { encoding: 'utf8' });
  }

  // 默认只能编译5M,改成131M，服务端email configure设置成131072
  const constants = readFileSync('./node_modules/pcf-scripts/constants.js', { encoding: 'utf8' });
  datas = constants.split('\n');
  foundIndex = datas.findIndex(p => p.includes(`exports.MAX_BUNDLE_SIZE_IN_MB = 5;`));
  if (foundIndex >= 0) {
    datas[foundIndex] = `exports.MAX_BUNDLE_SIZE_IN_MB = 131;`;
    writeFileSync('./node_modules/pcf-scripts/constants.js', datas.join('\n'), { encoding: 'utf8' });
  }

  const webpackConfig = readFileSync('./node_modules/pcf-scripts/webpackConfig.js', { encoding: 'utf8' });
  datas = webpackConfig.split('\n');
  foundIndex = datas.findIndex(p => p.includes(`function generateStub(namespace, constructor) {`));
  if (foundIndex >= 0) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!isGlobal) {
      datas[foundIndex] = 'function generateStub(namespace, constructor) { return `\\n${getNamespaceStub(namespace, constructor)}`;';
    } else {
      datas[foundIndex] = 'function generateStub(namespace, constructor) {';
    }
    writeFileSync('./node_modules/pcf-scripts/webpackConfig.js', datas.join('\n'), { encoding: 'utf8' });
  }

  // const manifest = readFileSync(`./${control}/ControlManifest.Input.xml`, { encoding: 'utf8' });
  // datas = manifest.split('\n');
  // while (true) {
  //   foundIndex = datas.findIndex(p => p.includes(`.ttf.png`) && p.includes('<!--'));
  //   if (foundIndex >= 0) {
  //     datas[foundIndex] = datas[foundIndex].replace('<!-- ', '').replace(' -->', '');
  //   } else {
  //     break;
  //   }
  // }
  // writeFileSync(`./${control}/ControlManifest.Input.xml`, datas.join('\n'), { encoding: 'utf8' });

  const controls = readdirSync('.');
  for (let i = controls.length - 1; i >= 0; i--) {
    if (!existsSync(join('.', controls[i], 'ControlManifest.Input.xml'))) {
      controls.splice(i, 1);
    }
  }

  console.log(`all controls: ${controls}`);

  // 改名除要处理的控件外的ControlManifest.Input.xml
  for (const element of controls) {
    if (element === control) {
      continue;
    }
    if (existsSync(join('.', element, 'ControlManifest.Input.xml'))) {
      renameSync(join('.', element, 'ControlManifest.Input.xml'), join('.', element, 'ControlManifest.Input.xml.bak'))
    }
  }

  if (existsSync(join('.', '.envs', '.env.dev'))) {
    renameSync(join('.', '.envs', '.env.dev'), join('.', '.envs', '.env.dev.bak'));
  }

  process.on('beforeExit', async (_code) => {
    await fixxml.deal();
  });

  try {
    shelljs.exec(`pac pcf version -s manifest`);
    shelljs.exec(`pac pcf push --publisher-prefix ${prefix}`);
  } catch (err) {
    console.error(err);
    await fixxml.deal();
  }

}

export { deal };
