import { SchemaRequest } from '../libs/common/request';
import chalk from 'chalk';
import { deal } from '../libs/pageupload/deal';

const command = async (args) => {

  const schemaRequest = new SchemaRequest();

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 4) {
    console.log(chalk.redBright('必须传入powerpage模块 filetype powerpage_mspp_webfile_id!'));
    return;
  }
  const [_, type, filetype, webfileid] = args['_'];
  console.log(`type: ${type}, filetype: ${filetype}, webfileid: ${webfileid}`);

  await deal(schemaRequest, type, filetype, webfileid);

};

export { command };
