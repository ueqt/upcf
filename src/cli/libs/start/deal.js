import { readFileSync, writeFileSync } from 'fs';
import shelljs from 'shelljs';
import * as bakxml from '../bakxml/deal';

const deal = async (control, isGlobal = false) => {

  console.log(`start: control: ${control}; isGlobal: ${!!isGlobal}`);

  // 修改StartTask，只启动当前控件，同时只能启动一个控件
  const startTask = readFileSync('./node_modules/pcf-scripts/tasks/startTask.js', {encoding: 'utf8'});
  let datas = startTask.split('\n');
  let foundIndex = datas.findIndex(p => p.includes(`const outputDir = path.join(outDir, controls[0]);`));
  if(foundIndex >= 0) {
    datas[foundIndex] = `const outputDir = path.join(outDir, '${control}'); // const outputDir = path.join(outDir, controls[0]);`;
    writeFileSync('./node_modules/pcf-scripts/tasks/startTask.js', datas.join('\n'), {encoding: 'utf8'});
  }

  // 修改buildContext，只启动当前控件，同时只能启动一个控件
  const buildContext = readFileSync('./node_modules/pcf-scripts/buildContext.js', {encoding: 'utf8'});
  datas = buildContext.split('\n');
  foundIndex = datas.findIndex(p => p.includes(`static findControlFolders(cwd, excludedFolders) {`));
  if(foundIndex >= 0) {
    datas[foundIndex] = `static findControlFolders(cwd, excludedFolders) { return ['${control}'];`;
    writeFileSync('./node_modules/pcf-scripts/buildContext.js', datas.join('\n'), {encoding: 'utf8'});
  }

  // 调试环境下没有Reactv16
  const platformVersions = readFileSync('./node_modules/pcf-scripts/PlatformLibraryVersions.json', {encoding: 'utf8'});
  datas = platformVersions.split('\n');
  foundIndex = datas.findIndex(p => p.includes(`"libAlias": "Reactv16",`));
  if(foundIndex >= 0) {
    datas[foundIndex] = `"libAlias": "React",`;
    writeFileSync('./node_modules/pcf-scripts/PlatformLibraryVersions.json', datas.join('\n'), {encoding: 'utf8'});
  }

  // 
  const webpackConfig = readFileSync('./node_modules/pcf-scripts/webpackConfig.js', {encoding: 'utf8'});
  datas = webpackConfig.split('\n');
  foundIndex = datas.findIndex(p => p.includes(`function generateStub(namespace, constructor) {`));
  if(foundIndex >= 0) {
  // eslint-disable-next-line no-extra-boolean-cast
    if(!!isGlobal) {
      datas[foundIndex] = 'function generateStub(namespace, constructor) { return `\\n${getNamespaceStub(namespace, constructor)}`;';  
    } else {
      datas[foundIndex] = 'function generateStub(namespace, constructor) {';  
    }
    writeFileSync('./node_modules/pcf-scripts/webpackConfig.js', datas.join('\n'), {encoding: 'utf8'});
  }

  // // 调试test harness时要注释掉ControlManifest.Input.xml里的ttf.png，否则会说Failed to load resource '': [object Event]，发布时要加上，并且不能用-，只能用_
  // 现在inline打包了，所以不需要改了
  // const manifest = readFileSync(`./${control}/ControlManifest.Input.xml`, {encoding: 'utf8'});
  // datas = manifest.split('\n');
  // while(true) {
  //   foundIndex = datas.findIndex(p => p.includes(`.ttf.png`) && !p.includes('<!--'));
  //   if(foundIndex >= 0) {
  //     datas[foundIndex] = '      <!-- ' + datas[foundIndex].trim() + ' -->';
  //   } else {
  //     break;
  //   }
  // }
  // writeFileSync(`./${control}/ControlManifest.Input.xml`, datas.join('\n'), {encoding: 'utf8'});

  // 把其他control的ControlManifest.Input.xml改名，否则也会启动
  await bakxml.deal(control);

  // 启动pcf
  shelljs.exec(`npm run startpcf watch ${control}`);

}

export { deal };
