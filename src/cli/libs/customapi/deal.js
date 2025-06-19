import { SchemaRequest } from '../common/request';
import { writeFileSync } from 'fs';

const deal = async (solutionid) => {
  const schemaRequest = new SchemaRequest(); 

  let customapis = await schemaRequest.request(`customapis`);

  console.log(`solutionid: ${solutionid}, customapis: ${customapis.length}`);

  if(solutionid) {
    customapis = customapis.filter(c => c.solutionid === solutionid);
  }

  console.log(`customapis: ${customapis.length}`);

  const results = [];

  for(let i=0;i<customapis.length;i++) {
    let result = {
      AssemblyName: 'Plugins',
      TypeName: '',
      Steps: 'CustomAPI',
      Mode: 'Synchronous',
      Stage: 'CustomAPI',
      Message: customapis[i].uniquename,
      Entity: '',
      Description: '',
      Logic: '',
      Developer: '',
    }

    console.log(customapis[i].customapiid);

    const customapi = await schemaRequest.request(`customapis(${customapis[i].customapiid})`, {
        noNeedValue: true,
        otherHeaders: {
          Prefer: 'odata.include-annotations="*"'
        }
      }
    );

    result.TypeName = customapi['_plugintypeid_value@OData.Community.Display.V1.FormattedValue'];
    result.Entity = customapi['boundentitylogicalname'];
    result.Developer = customapi['_createdby_value@OData.Community.Display.V1.FormattedValue'];

    results.push(result);
  }

  writeFileSync('./customapis.json', JSON.stringify(results, null, 2), { encoding: 'utf8' });
}

export { deal };
