import axios, {AxiosRequestConfig} from "axios";
import {Credentials, Token} from "../utils/credentials";

class MaterialsApi {

    baseURL = "https://api-materials.doc.ic.ac.uk"

    token: Token;

    constructor(token: Token) {
        this.token = token;
    }

    async getCourses() {
        const config: AxiosRequestConfig = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            url: this.baseURL + "/courses/2021"
        }
        return axios.request(config)
    }

    async getCourseResources(courseCode: string) {
        const config: AxiosRequestConfig = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            url: this.baseURL + "/resources?year=2021&course=" + courseCode
        }
        return axios.request(config)
    }

    async getResource(resourceID: number) {
        const config: AxiosRequestConfig = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            url: this.baseURL + "/resources/" + resourceID + "/file"
        }
        return axios.request(config)
    }

}

export function testAuth(credentials: Credentials): Promise<string | undefined> {
    return axios.post("https://api-materials.doc.ic.ac.uk/auth/login", credentials).then(r => {
        return r.data.access_token
    }).catch(err => {
        return undefined
    })
}

export default MaterialsApi;
