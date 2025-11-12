import { SchemaRequest } from '../libs/common/request';
import { writeFileSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import { deal } from '../libs/schema/deal';

const command = async (args) => {

  const schemaRequest = new SchemaRequest();
  let cleanMode = false;
  let searchPath = '';
  let namespace = '';
  let enumWithValue = false;

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
  if(args.enumWithValue) {
    console.log(chalk.bgCyanBright('Enum With Value'));
    enumWithValue = true;
  }
  const [_, codeType, ...logicalNames] = args['_'];
  console.log(`codeType: ${codeType}`);

  if(codeType === 'cs') {
    if(!args.namespace) {
      console.log(chalk.bgRedBright('--namespace must input in cs type!'));
      return;
    }
    namespace = args.namespace;
  }

  let indexEntitiesTs = '';
  let indexEnumsTs = '';

  for (const logicalName of logicalNames) {
    console.log(`===== ${logicalName} =====`);
    const logicalCollectionName = (await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')?$select=LogicalCollectionName`, {noNeedValue: true})).LogicalCollectionName;
    const attrs = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes?LabelLanguages=1033`);
    const statecodeOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$expand=OptionSet&LabelLanguages=1033`);
    const chineseStatecodeOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$expand=OptionSet&LabelLanguages=2052`);
    const statuscodeOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet&LabelLanguages=1033`);
    const chineseStatuscodeOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet&LabelLanguages=2052`);
    const picklistOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet,GlobalOptionSet&LabelLanguages=1033`);
    const chinesePicklistOptions = await schemaRequest.request(`EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet,GlobalOptionSet&LabelLanguages=2052`);
    const generatedFileNames = await deal(schemaRequest, codeType, attrs, [...statecodeOptions, ...statuscodeOptions, ...picklistOptions], [...chineseStatecodeOptions, ...chineseStatuscodeOptions, ...chinesePicklistOptions], logicalName, logicalCollectionName, cleanMode, args.path, searchPath, namespace, enumWithValue);
    if(codeType === 'ts') {
      for(let i=0;i<generatedFileNames.entities.length;i++) {
        indexEntitiesTs += `export * from './${generatedFileNames.entities[i].replace('.ts', '')}';\n`;
      }
      for(let i=0;i<generatedFileNames.enums.length;i++) {
        indexEnumsTs += `export * from './${generatedFileNames.enums[i].replace('.ts', '')}';\n`;
      }
    }
  }

  if(codeType === 'ts') {
    if(indexEntitiesTs) {
      writeFileSync(resolve(join(args.path, 'Entities', 'index.ts')), indexEntitiesTs, { encoding: 'utf-8' });
    }
    if(indexEnumsTs) {
      writeFileSync(resolve(join(args.path, 'Enums', 'index.ts')), indexEnumsTs, { encoding: 'utf-8' });
    }
  }
};

export { command };
