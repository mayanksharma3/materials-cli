import axios, {AxiosRequestConfig} from "axios";
import {Credentials, Token} from "../utils/credentials";
import {baseURL, year} from "../utils/config";
import {Resource} from "../utils/resource";
import path from "path";
import fs from "fs";

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

    async downloadFile(resource: Resource, index: number, folderPath: string, courseName: string) {
        const fullFolderPath = path.join(folderPath, courseName, resource.category);
        const filePath = path.join(folderPath, courseName, resource.category, resource.title)
        fs.mkdirSync(fullFolderPath, {recursive: true});
        const encodedCategory = encodeURIComponent(resource.category)
        return axios.get(this.baseURL + "/resources/" + resource.id + "/file", {
            responseType: "stream",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        }).then((response) => {
            const stream = response.data.pipe(fs.createWriteStream(filePath));
            return new Promise((resolve, reject) => {
                stream.on("finish", () => {
                    return resolve(true)
                })
            })

        })
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
