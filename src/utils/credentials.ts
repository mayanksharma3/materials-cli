export interface Credentials {
    username: string;
    password: string;
}

export interface CredentialsAndToken {
    credentials: Credentials;
    token: Token;
}

export type Token = string;
export type Cookie = string;
