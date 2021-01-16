#!/usr/bin/env node

import {askCredentials, pickCourse, setFolder} from "./lib/inquirer";
import Configstore from "configstore";
import MaterialsApi, {testAuth} from "./lib/materials-api";
import {startUp} from "./utils/startup";
import {Course} from "./utils/course";
import chalk from "chalk";
import {Resource} from "./utils/resource";
import MaterialsLegacy, {authLegacy} from "./lib/materials-legacy";
import {id} from "./utils/config";

const run = async () => {
    startUp()

    const conf = new Configstore(id);

    if (process.argv.includes("clean")) {
        conf.clear()
        console.log(chalk.greenBright("Configuration cleared!"))
        return;
    }

    let credentialsAndToken = await askCredentials();

    const cookie = await authLegacy({
        username: credentialsAndToken.username,
        password: credentialsAndToken.password
    })
    const materialsLegacy = new MaterialsLegacy(cookie)

    if (!conf.has("folderPath")) {
        const folderPath = await setFolder()
        conf.set("folderPath", folderPath)
    }

    // token found
    const materialsAPI = new MaterialsApi(credentialsAndToken.token)

    const courses = await materialsAPI.getCourses()
    const courseNameChosen = await pickCourse(courses.data as Course[])
    const course = courses.data.find(x => x.title === courseNameChosen.course) as Course
    console.log(chalk.yellow("Fetching course materials..."))
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    const nonLinkResources = resourcesResult.data.filter(x => x.type == 'file') as Resource[]
    console.log(chalk.greenBright(`Found ${nonLinkResources.length} resources!`))
    let downloadedFiles = 0;
    for (let i = 0; i < nonLinkResources.length; i++) {
        const downloaded = await materialsLegacy.downloadFile(nonLinkResources[i], i, conf.get("folderPath").folderPath, course.title)
        if(downloaded) {
            downloadedFiles++;
            console.log(chalk.greenBright("Downloaded " + nonLinkResources[i].title + "!"))
        } else {
            console.log(chalk.yellow(nonLinkResources[i].title  + " already downloaded"))
        }
    }
    console.log(chalk.greenBright(`Downloaded ${downloadedFiles} resources!`))
};

run();

