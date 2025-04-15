import { SchemaRequest } from './request';
// https://stackoverflow.com/questions/42218151/dynamics-crm-365-webapi-publish-webresource-via-javascript

const publishAllXml = async () => {
  // var req = new XMLHttpRequest();
  // req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v8.1/PublishAllXml", true);
  // req.setRequestHeader("OData-MaxVersion", "4.0");
  // req.setRequestHeader("OData-Version", "4.0");
  // req.setRequestHeader("Accept", "application/json");
  // req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  // req.onreadystatechange = function() {
  //     if (this.readyState === 4) {
  //         req.onreadystatechange = null;
  //         if (this.status === 204) {
  //             //Success - No Return Data - Do Something
  //             alert("it worked!");
  //         } else {
  //             Xrm.Utility.alertDialog(this.statusText);
  //         }
  //     }
  // };
  // req.send();
};

const publishXml = async (entities = [], webresources = []) => {
  const parameters = {};
  // entity用logicalname，webresouce用webresouceid
  parameters.ParameterXml = `<importexportxml>
${entities.length > 0 ? '<entities>' + entities.map(c => '<entity>' + c + '</entity>').join('') + '</entities>' : ''}
${webresources.length > 0 ? '<webresources>' + webresources.map(c => '<webresource>' + c + '</webresource>').join('') + '</webresources>' : ''}
</importexportxml>`;

  // 发布account实体
  // parameters.ParameterXml = "<importexportxml><entities><entity>account</entity></entities></importexportxml>";
  
  const schemaRequest = new SchemaRequest();

  const result = await schemaRequest.request('PublishXml', {
    method: 'POST', 
    body: parameters,
    noNeedValue: true,
  });
  console.log(result);
};

const addSolutionComponent = async (entityId, entityType, solutionUniqueName) => {
  // https://stackoverflow.com/questions/55654055/how-to-add-an-entity-to-a-solution-with-javascript-using-web-api-action-addsolut
  const param = { 
    'ComponentId':  entityId , // newly created entity id 
    'ComponentType': entityType, // entity type // https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/solutioncomponent?view=dataverse-latest&viewFallbackFrom=dynamics-ce-odata-9
    'SolutionUniqueName': solutionUniqueName,  // solution name (without spaces)
    'AddRequiredComponents': false,
    'IncludedComponentSettingsValues':null
  };
  
  const schemaRequest = new SchemaRequest();

  const result = await schemaRequest.request('AddSolutionComponent', {
    method: 'POST', 
    body: parameters,
    noNeedValue: true,
  });
  console.log(result);
};

export { publishXml, publishAllXml, addSolutionComponent };
