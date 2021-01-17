import axios, {AxiosRequestConfig} from "axios";
import {Credentials, Token} from "../utils/credentials";
import {baseURL, year} from "../utils/config";

class MaterialsApi {

    baseURL = baseURL
    token: Token;

    constructor(token: Token) {
        this.token = token;
    }

    async getCourses() {
        return axios.request(this.buildAxiosConfig("/courses/" + year()))
    }

    async getCourseResources(courseCode: string) {
        return axios.request(this.buildAxiosConfig(`/resources?year=${year()}&course=` + courseCode))
    }

    async getResource(resourceID: number) {
        return axios.request(this.buildAxiosConfig("/resources/" + resourceID + "/file"))
    }

    private buildAxiosConfig(path: string): AxiosRequestConfig {
        return {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            url: this.baseURL + path
        }
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
