import { SchemaRequest } from '../common/request';
import { writeFileSync } from 'fs';

const deal = async (solutionid) => {
  const schemaRequest = new SchemaRequest();

  let customapis = await schemaRequest.request(`customapis`, {
    otherHeaders: {
      Prefer: 'odata.include-annotations="*"'
    }
  });

  console.log(`solutionid: ${solutionid}, customapis: ${customapis.length}`);

  if (solutionid) {
    customapis = customapis.filter(c => c.solutionid === solutionid);
  }

  console.log(`customapis: ${customapis.length}`);

  const results = [];

  for (let i = 0; i < customapis.length; i++) {
    const customapi = customapis[i];
    let result = {
      AssemblyName: '',
      TypeName: '',
      Steps: 'CustomAPI',
      Mode: 'Synchronous',
      Stage: 'CustomAPI',
      Message: customapi.uniquename,
      Entity: '',
      Developer: '',
    }

    console.log(customapi.customapiid);

    result.TypeName = customapi['_plugintypeid_value@OData.Community.Display.V1.FormattedValue'];
    result.Entity = customapi['boundentitylogicalname'] || 'N/A';
    result.Developer = customapi['_createdby_value@OData.Community.Display.V1.FormattedValue'];

    const plugintype = await schemaRequest.request(`plugintypes(${customapi['_plugintypeid_value']})`, {
      noNeedValue: true,
    });
    result.AssemblyName = plugintype['assemblyname'];

    results.push(result);
  }

  writeFileSync('./customapis.json', JSON.stringify(results, null, 2), { encoding: 'utf8' });
}

export { deal };
