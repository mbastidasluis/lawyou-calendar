import { Client } from "@microsoft/microsoft-graph-client";
import { authProvider } from './Config';

const options = {
    authProvider, // An instance created from previous step
};
const client = Client.initWithMiddleware(options);


export const getUserDetails = async () => {
    try {
        let userDetails = await client.api("/me").get();
        console.log(userDetails);
    } catch (error) {
        console.log(error);
    }
}