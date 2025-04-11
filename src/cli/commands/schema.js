import { SchemaRequest } from '../libs/schema/request';
import chalk from 'chalk';
import { deal } from '../libs/schema/deal';

const command = async (args) => {

  const schemaRequest = new SchemaRequest();
  let cleanMode = false;
  let searchPath = '';

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 3) {
    console.log(chalk.redBright('必须传入CodeType(ts/cs) LogicalNames!'));
    return;
  }
  if(!args.path) {
    console.log(chalk.bgRedBright('--path must input!'));
    return;
  } else {
    console.log(chalk.bgCyanBright(`RelativePath: ${args.path}`));
  }
  if (args.clean) {
    console.log(chalk.bgCyanBright('Clean Mode'));
    cleanMode = true;
    if(!args.searchpath) {
      console.log(chalk.bgRedBright('--searchpath must input in clean mode!'));
      return;
    }
    searchPath = args.searchpath;
  }
  const [_, codeType, ...logicalNames] = args['_'];
  console.log(`codeType: ${codeType}`);
  for (const logicalName of logicalNames) {
    console.log(`===== ${logicalName} =====`);
    const attrs = await schemaRequest.request(logicalName, `EntityDefinitions(LogicalName='${logicalName}')/Attributes`);
    const statecodeOptions = await schemaRequest.request(logicalName, `EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$expand=OptionSet`);
    const statuscodeOptions = await schemaRequest.request(logicalName, `EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet`);
    const picklistOptions = await schemaRequest.request(logicalName, `EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet,GlobalOptionSet`);
    await deal(codeType, attrs, [...statecodeOptions, ...statuscodeOptions, ...picklistOptions], logicalName, cleanMode, args.path, searchPath);
  }

};

export { command };
