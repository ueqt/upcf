import { SchemaRequest } from '../common/request';
import { writeFileSync } from 'fs';

const deal = async (solutionid) => {
  const schemaRequest = new SchemaRequest();

  let plugins = await schemaRequest.request(`msdyn_solutioncomponentsummaries?%24filter=(msdyn_solutionid%20eq%20${solutionid})%20and%20((msdyn_componenttype%20eq%2092))&%24orderby=msdyn_displayname%20asc&api-version=9.1`);

  console.log(`solutionid: ${solutionid}, plugins: ${plugins.length}`);

  console.log(`first: `, plugins[0]);

  const results = [];

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    let result = {
      AssemblyName: plugin.msdyn_eventhandler.startsWith('Philips.Service.Plugins') ? 'Plugins' : (plugin.msdyn_eventhandler.startsWith('Philips.Crm.Plugins') ? 'Philips.Crm.Plugins' : ''), 
      TypeName: plugin.msdyn_eventhandler,
      Steps: plugin.msdyn_name,
      Mode: plugin.msdyn_isolationmode,
      Stage: plugin.msdyn_executionstage,
      Message: plugin.msdyn_sdkmessagename,
      Entity: plugin.msdyn_name.replace(`${plugin.msdyn_eventhandler}: ${plugin.msdyn_sdkmessagename} of `, ''),
    }

    results.push(result);
  }

  writeFileSync('./plugins.json', JSON.stringify(results, null, 2), { encoding: 'utf8' });
}

export { deal };
