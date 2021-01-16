import {Cookie, Credentials} from "../utils/credentials";
import request from "request";
import {legacyBaseURL} from "../utils/config";
import axios from "axios";
import * as fs from "fs";
import {Resource} from "../utils/resource";

class MaterialsLegacy {

    cookie: Cookie;

    constructor(cookie: Cookie) {
        this.cookie = cookie;
    }

    async downloadFile(resource: Resource, index: number, folderPath: string, courseName: string) {
        fs.mkdirSync(folderPath + "/" + courseName + "/" +  resource.category, {recursive: true});
        let filePath = folderPath + "/" + courseName + "/" +  resource.category + "/" + resource.title;
        if (!fs.existsSync(filePath)) {
            const encodedCategory = encodeURIComponent(resource.category)
            return axios.get(`https://materials.doc.ic.ac.uk/view/${resource.year}/${resource.course}/${encodedCategory}/${index}`, {
                headers: {"Cookie": this.cookie},
                responseType: "stream"
            }).then((response) => {
                response.data.pipe(fs.createWriteStream(filePath));
                return true
            })
        }
        return false
    }

}

export function authLegacy(credentials: Credentials): Promise<string> {
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
    return new Promise((resolve, reject) => {
        request(options, function (error, response) {
            if (error) reject();
            resolve(response.headers['set-cookie'][0]);
        });
    })

}

export default MaterialsLegacy;
