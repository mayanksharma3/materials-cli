import {Cookie, Credentials} from "../utils/credentials";
import {legacyBaseURL} from "../utils/config";
import axios from "axios";
import * as fs from "fs";
import {Resource} from "../utils/resource";
import * as path from "path";
import unirest from "unirest";

class MaterialsLegacy {

    cookie: Cookie;

    async downloadFile(resource: Resource, index: number, folderPath: string, courseName: string) {
        const fullFolderPath = path.join(folderPath, courseName, resource.category);
        const filePath = path.join(folderPath, courseName, resource.category, resource.title)
        fs.mkdirSync(fullFolderPath, {recursive: true});
        const encodedCategory = encodeURIComponent(resource.category)
        return axios.get(`https://materials.doc.ic.ac.uk/view/${resource.year}/${resource.course}/${encodedCategory}/${index}`, {
            headers: {"Cookie": this.cookie},
            responseType: "stream"
        }).then((response) => {
            const stream = response.data.pipe(fs.createWriteStream(filePath));
            return new Promise((resolve, reject) => {
                stream.on("finish", () => {
                    return resolve(true)
                })
            })

        })
    }

    async authLegacy(credentials: Credentials) {
        this.cookie = await new Promise((resolve, reject) => {
            unirest('POST', legacyBaseURL)
                .headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                .send('username=' + credentials.username)
                .send('password=' + credentials.password)
                .end(function (res) {
                    if (res.error) throw new Error(res.error);
                    resolve(res.headers['set-cookie'][0]);
                });
        });
    }

}

export default MaterialsLegacy;
