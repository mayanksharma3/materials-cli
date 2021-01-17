import MaterialsLegacy from "./materials-legacy";
import {Resource} from "../utils/resource";
import path from "path";
import fs from "fs";
import Listr, {ListrTask} from "listr";
import chalk from "chalk";
import {promptOpenFolder} from "./inquirer";
import open from "open";

class ConcurrentDownloader {

    materialsLegacy: MaterialsLegacy;
    course: string;
    folderPath: string;
    tasks: ListrTask[] = [];


    constructor(materialsLegacy: MaterialsLegacy, course: string, folderPath: string) {
        this.materialsLegacy = materialsLegacy;
        this.course = course;
        this.folderPath = folderPath;
    }

    scheduleDownloads(resources: Resource[]) {
        for (let i = 0; i < resources.length; i++) {
            let currentResource = resources[i];
            const filePath = path.join(this.folderPath, this.course, currentResource.category, currentResource.title)
            if (!fs.existsSync(filePath)) {
                this.tasks.push({
                    title: "Downloading " + currentResource.title,
                    task: async () => {
                        await this.materialsLegacy.downloadFile(currentResource, currentResource.index, this.folderPath, this.course)
                    }
                })
            }

        }
    }

    executeDownloads() {
        const numToDownload = this.tasks.length;
        if (numToDownload !== 0) {
            const listr = new Listr(this.tasks, {concurrent: true})
            return listr.run().catch(err => {
                console.error(err);
            }).then(async () => {
                if (numToDownload != 0) {
                    console.log(chalk.greenBright(`Downloaded ${numToDownload} new resources!`))
                    const openFolderResponse = await promptOpenFolder()
                    if (openFolderResponse.openFolder) {
                        await open(path.join(this.folderPath, this.course))
                    }
                }
            });
        } else {
            console.log(chalk.greenBright("All resources already downloaded, no new to pull!"))
        }
    }

}

export default ConcurrentDownloader;
