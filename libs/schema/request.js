import { ConfidentialClientApplication, PublicClientApplication } from '@azure/msal-node';
import chalk from 'chalk';
import { config } from 'dotenv';

class SchemaRequest {

  constructor() {
    config({ path: './.envs/.env' });
    this.cca = process.env.VITE_ClientSecret ? new ConfidentialClientApplication({
      auth: {
        clientId: process.env.VITE_ClientId,
        clientSecret: process.env.VITE_ClientSecret,
        authority: process.env.VITE_AzureCloud,
        azureCloudOptions: {
          azureCloudInstance: process.env.VITE_AzureCloud,
          tenant: process.env.VITE_TenantId
        }
      }
    }) : new PublicClientApplication({
      auth: {
        clientId: process.env.VITE_ClientId,
        authority: process.env.VITE_AzureCloud,
        azureCloudOptions: {
          azureCloudInstance: process.env.VITE_AzureCloud,
          tenant: process.env.VITE_TenantId
        }
      }
    });
  }

  async getToken() {
    if (this.cca instanceof ConfidentialClientApplication) {
      const accessTokenRequest = {
        scopes: [`${process.env.VITE_BaseUrl}/.default`],
      };
      const response = await this.cca.acquireTokenByClientCredential(accessTokenRequest);
      return `${response.tokenType} ${response.accessToken}`;
    } else if (this.cca instanceof PublicClientApplication) {
      const deviceCodeRequest = {
        deviceCodeCallback: (response) => (console.log(response.message)),
        scopes: [`${process.env.VITE_BaseUrl}/.default`],
        timeout: 600,
      };
      const response = await this.cca.acquireTokenByDeviceCode(deviceCodeRequest);
      // console.log(response);
      return `${response.tokenType} ${response.accessToken}`;
    } else {
      throw new Error(`Not implement type: ${typeof this.cca}`);
    }
  };

  /**
   * Do Request
   * @param {string} logicalName 
   * @param {string} action 
   * @param {'GET' | 'POST'} method 
   * @param {*} body 
   * @param {*} otherHeaders 
   * @returns {*} result
   */
  async request(logicalName, action, method='GET', body = undefined, otherHeaders = {}) {
    const bearer = await this.getToken();
    const headers = {
      'Authorization': bearer,
      'Content-Type': 'application/json',
      ...otherHeaders
    };

    const options = {
      method: method,
      headers: headers,
      body: !body ? undefined : (headers.content === 'application/octet-stream' ? body : JSON.stringify(body))
    };

    // console.log(options);

    try {
      const response = await fetch(`${process.env.VITE_BaseUrl}/api/data/v9.2/${action}`, options);
      // console.log(response.status);
      if (response.status === 204) {
        // callback(response.statusText);
        return;
      } else {
        const result = await response.json();
        // console.log(result);
        return result.value;
      }
    } catch (error) {
      console.log(chalk.redBright(error));
    }
  };

}

export { SchemaRequest };
