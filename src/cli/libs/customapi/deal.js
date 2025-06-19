import { SchemaRequest } from '../common/request';

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

    const customapi = await schemaRequest.request(`customapis(${customapis[i].customapiid})`
      //   , {
      //   otherHeaders: {
      //     Prefer: 'odata.include-annotations="Microsoft.Dynamics.CRM.associatednavigationproperty,Microsoft.Dynamics.CRM.lookuplogicalname"'
      //   }
      // }
    );

    console.log(customapi);
    return;
    // result.TypeName = customapi.

    results.push(result);
  }
}

export { deal };
