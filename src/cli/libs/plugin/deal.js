import { SchemaRequest } from '../common/request';
import { writeFileSync } from 'fs';

const deal = async (solutionid) => {
  const schemaRequest = new SchemaRequest();

  let plugins = await schemaRequest.request(`msdyn_solutioncomponentsummaries?%24filter=(msdyn_solutionid%20eq%20${solutionid})%20and%20((msdyn_componenttype%20eq%2092))&%24orderby=msdyn_displayname%20asc&api-version=9.1`, {
    otherHeaders: {
      Prefer: 'odata.include-annotations="*"'
    }
  });

  console.log(`solutionid: ${solutionid}, plugins: ${customapis.length}`);

  const results = [];

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    let result = {
      TypeName: plugin.msdyn_name,
      Steps: plugin.msdyn_sdkmessagename,
      Mode: plugin.msdyn_isolationmode,
      Stage: plugin.msdyn_executionstage,
      Message: plugin.msdyn_sdkmessagename,
      Entity: plugin['_msdyn_objectid_value@OData.Community.Display.V1.FormattedValue'],
    }

    results.push(result);
  }

  writeFileSync('./plugins.json', JSON.stringify(results, null, 2), { encoding: 'utf8' });
}

export { deal };
