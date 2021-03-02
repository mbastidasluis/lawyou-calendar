import { UserAgentApplication } from "msal";

import { ImplicitMSALAuthenticationProvider } from "@microsoft/microsoft-graph-client/lib/src/ImplicitMSALAuthenticationProvider";
import { MSALAuthenticationProviderOptions } from '@microsoft/microsoft-graph-client/lib/src/MSALAuthenticationProviderOptions';

// An Optional options for initializing the MSAL @see https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL-basics#configuration-options
const msalConfig = {
  auth: {
    clientId: "0c0f09d7-0679-4fbd-8b92-53fb15f969a7", // Client Id of the registered application
    redirectUri: "http://localhost:3000",
  },
};
const graphScopes = ['User.Read', 'Calendars.ReadWrite.Shared']; // An array of graph scopes

// Important Note: This library implements loginPopup and acquireTokenPopup flow, remember this while initializing the msal
// Initialize the MSAL @see https://github.com/AzureAD/microsoft-authentication-library-for-js#1-instantiate-the-useragentapplication
export const msalApplication = new UserAgentApplication(msalConfig);
const options = new MSALAuthenticationProviderOptions(graphScopes);
export const authProvider = new ImplicitMSALAuthenticationProvider(msalApplication, options);
