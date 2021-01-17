import keytar from "keytar";
import {id} from "../utils/config";
import {Credentials} from "../utils/credentials";

class Keystore {

    async deleteCredentials() {
        const credentials = await keytar.findCredentials(id)
        for (let i = 0; i < credentials.length; i++) {
            await keytar.deletePassword(id, credentials[i].account);
        }
    }

    async getCredentials(): Promise<Credentials | undefined> {
        const credentials = await keytar.findCredentials(id)
        return credentials.length !== 0 ? this.convertToCredentials(credentials[0]) : undefined
    }

    async setCredentials(credentials: Credentials) {
        await keytar.setPassword(id, credentials.username, credentials.password)
    }

    private convertToCredentials(account: {account: string, password: string}): Credentials {
        return {username: account.account, password: account.password}
    }
}

export default Keystore;
