import keytar from "keytar";

export interface Credentials {
    username: string;
    password: string;
}

export type Token = string;
export type Cookie = string;


export async function deleteCredentials() {
    const credentials = await keytar.findCredentials("materials-cli")
    for (let i = 0; i < credentials.length; i++) {
        await keytar.deletePassword("materials-cli", credentials[i].account);
    }
}
