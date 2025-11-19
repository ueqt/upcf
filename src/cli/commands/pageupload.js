import { SchemaRequest } from '../libs/common/request';
import { writeFileSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import { deal } from '../libs/pageupload/deal';

const command = async (args) => {

  const schemaRequest = new SchemaRequest();

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 3) {
    console.log(chalk.redBright('必须传入powerpage模块 powerpage_mspp_webfile_id!'));
    return;
  }
  const [_, type, webfileid] = args['_'];
  console.log(`type: ${type}, webfileid: ${webfileid}`);

  await deal(schemaRequest, type, webfileid);

};

export { command };
