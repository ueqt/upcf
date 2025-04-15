import chalk from 'chalk';
import { SchemaRequest } from '../common/request';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { publishXml, addSolutionComponent } from '../common/crm';

const getWebResourceType = (filepath) => {
  // https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/webresource?view=dataverse-latest
  const ext = extname(filepath).toLocaleLowerCase();
  if(ext === '.htm' || ext === '.html') {
    return 1;
  } else if(ext === '.css') {
    return 2;
  } else if(ext === '.js' || ext === '.js.map') {
    return 3;
  } else if(ext === '.png') {
    return 5;
  } else if(ext === '.jpg' || ext === '.jpeg') {
    return 6;
  } else if(ext === '.gif') {
    return 7;
  } else if(ext === '.ico') {
    return 10;
  } else if(ext === '.svg') {
    return 11;
  } else if(ext === 'resx') {
    return 12;
  }
};

const updateRemoteFromLocalAsync = async (schemaRequest, filepath, prefix, solutionUniqueName) => {
  console.log(chalk.bgGreenBright(`Updating webresources...  ${filepath}`));

  const testPath = filepath; 
  // const testPath = join('/Users/ueqt/Documents/philips/Philips.Service/WebResources', filepath);

  const fileContent = readFileSync(testPath, { encoding: 'base64' });
  // console.log(fileContent);
  const webresoucename = `${prefix}_/${filepath}`;
  const foundWebResouces = await schemaRequest.request(`webresourceset?$filter=name eq '${webresoucename}'`);
  // console.log(foundWebResouces);
  let webresouceid = '';
  if(foundWebResouces && foundWebResouces.length > 0) {
    // 更新
    webresouceid = foundWebResouces[0].webresourceid;
    console.log('webresouceid: ', webresouceid);
    console.log('to be updated...');
    await schemaRequest.request(`webresourceset(${webresouceid})`, { method: 'PATCH', body: { content: fileContent }, noNeedValue: true });
  } else {
    // 创建
    console.log('to be created...');
    const result = await schemaRequest.request(`webresourceset`, { method: 'POST', body: {
      name: webresoucename,
      displayname: webresoucename,
      webresourcetype: getWebResourceType(filepath),
      content: fileContent
    } });
    console.log(result);
    webresouceid = result.webresourceid;
  }
  await addSolutionComponent(webresouceid, 61, solutionUniqueName);
  return webresouceid;
};

const deal = async (filepath, solutionUniqueName) => {
  const schemaRequest = new SchemaRequest();
  const solutions = await schemaRequest.request(`solutions`);
  const solution = solutions.find(c => c.uniquename === solutionUniqueName);
  // console.log(`solution: `, solution);
  const solutionid = solution['solutionid'];
  if (!solution) {
    console.log(chalk.bgRedBright(`not found solution for ${solutionUniqueName}`));
    return;
  }
  const publisherid = solution['_publisherid_value'];
  const publisher = await schemaRequest.request(`publishers(${publisherid})`, { noNeedValue: true });
  // console.log(`publisher: `, publisher);
  const prefix = publisher['customizationprefix'];
  console.log(`prefix: `, prefix);

  const webresouceid = await updateRemoteFromLocalAsync(schemaRequest, filepath, prefix, solutionUniqueName);
  console.log(`webresouceid: `, webresouceid);
  await publishXml([], [webresouceid]);
}

export { deal };
