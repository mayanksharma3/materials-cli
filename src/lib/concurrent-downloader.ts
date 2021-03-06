import {Resource, ResourceWithLink} from "../utils/resource";
import path from "path";
import fs from "fs";
import Listr, {ListrTask} from "listr";
import chalk from "chalk";
import {promptOpenFolder} from "./inquirer";
import open from "open";
import {downloadURL} from "./link-downloader";
import MaterialsApi from "./materials-api";

class ConcurrentDownloader {

    materialsAPI: MaterialsApi;
    course: string;
    folderPath: string;
    tasks: ListrTask[] = [];


    constructor(materialsLegacy: MaterialsApi, course: string, folderPath: string) {
        this.materialsAPI = materialsLegacy;
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
                        await this.materialsAPI.downloadFile(currentResource, currentResource.index, this.folderPath, this.course)
                    }
                })
            }

        }
    }

    scheduleLinkDownloads(resources: ResourceWithLink[]) {
        for (let i = 0; i < resources.length; i++) {
            let currentResource = resources[i];
            const filePath = path.join(this.folderPath, this.course, currentResource.category, currentResource.title + ".pdf")
            if (!fs.existsSync(filePath)) {
                this.tasks.push({
                    title: "Downloading " + currentResource.title,
                    task: async () => {
                        await downloadURL(this.folderPath, this.course, currentResource)
                    }
                })
            }
        }
    }

    async executeDownloads(openFolder: boolean) {
        const numToDownload = this.tasks.length;
        if (numToDownload !== 0) {
            const listr = new Listr(this.tasks, {concurrent: true})
            return await listr.run().catch(err => {
                console.error(err);
            }).then(async () => {
                console.log(chalk.greenBright(`Downloaded ${numToDownload} new resources!`))
                if (openFolder) {
                    const openFolderResponse = await promptOpenFolder()
                    if (openFolderResponse.openFolder) {
                        await open(path.join(this.folderPath, this.course))
                    }
                }
            });
        } else {
            console.log(chalk.greenBright("All resources already downloaded, no new to pull!"))
            if (openFolder) {
                const openFolderResponse = await promptOpenFolder()
                if (openFolderResponse.openFolder) {
                    await open(path.join(this.folderPath, this.course))
                }
            }
        }
    }

}

export default ConcurrentDownloader;
