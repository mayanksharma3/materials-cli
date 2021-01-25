import axios from "axios";
import fs from "fs";
import path from "path";
import {ResourceWithLink} from "../utils/resource";

export function downloadURL(folderPath: string, courseName: string, resource: ResourceWithLink) {
    const fullFolderPath = path.join(folderPath, courseName, resource.category);
    fs.mkdirSync(fullFolderPath, {recursive: true});
    const filePath = path.join(folderPath, courseName, resource.category, resource.title + ".pdf")
    if (!fs.existsSync(filePath)) {
        return axios.get(resource.path, {
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
}
