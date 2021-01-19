import {Cookie, Credentials} from "../utils/credentials";
import request from "request";
import {legacyBaseURL} from "../utils/config";
import axios from "axios";
import * as fs from "fs";
import {Resource} from "../utils/resource";
import * as path from "path";

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
        const options = {
            'method': 'POST',
            'url': legacyBaseURL,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'username': credentials.username,
                'password': credentials.password
            }
        };
        this.cookie = await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) reject();
                resolve(response.headers['set-cookie'][0]);
            });
        });
    }

}

export default MaterialsLegacy;
