import { SchemaRequest } from '../common/request';
import { writeFileSync } from 'fs';

const deal = async (solutionid) => {
  const schemaRequest = new SchemaRequest();

  let flows = await schemaRequest.request(`msdyn_solutioncomponentsummaries?%24filter=(msdyn_solutionid%20eq%20${solutionid})%20and%20((msdyn_componenttype%20eq%2029%20and%20msdyn_workflowcategory%20eq%20%275%27))&%24orderby=msdyn_displayname%20asc&api-version=9.1`);

  console.log(`solutionid: ${solutionid}, flows: ${flows.length}`);

  console.log(`first: `, flows[0]);

  const results = [];

  for (let i = 0; i < flows.length; i++) {
    const flow = flows[i];
    if(flow.msdyn_statusname !== 'Activated') {
      continue;
    }
    let result = {
      BusinessModule: '',
      Name: flow.msdyn_name,
      ScheduledFlow: '',
      TriggerFlow: '',
      TableName: '',
      Scope: '',
      SelectColumns: '',
      FilterRows: '',
      Developer: flow.msdyn_owner,
    }

    results.push(result);
  }

  writeFileSync('./flows.json', JSON.stringify(results, null, 2), { encoding: 'utf8' });
}

export { deal };
