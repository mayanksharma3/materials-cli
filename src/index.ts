#!/usr/bin/env node

import {askCredentials, pickCourse, setFolder} from "./lib/inquirer";
import keytar from "keytar";
import Configstore from "configstore";
import MaterialsApi, {testAuth} from "./lib/materials-api";
import {startUp} from "./utils/startup";
import {Course} from "./utils/course";
import chalk from "chalk";
import {Resource} from "./utils/resource";
import MaterialsLegacy, {authLegacy} from "./lib/materials-legacy";
import {id} from "./utils/config";
import {deleteCredentials} from "./utils/credentials";
import ora from "ora";

const run = async () => {
    startUp()

    const conf = new Configstore(id);

    if (process.argv.includes("clean")) {
        await deleteCredentials()
        conf.clear()
        console.log(chalk.greenBright("Configuration cleared!"))
        return;
    }


    let existingCredentials = await keytar.findCredentials(id)

    let token = ""
    if (existingCredentials.length == 0) {
        token = await askCredentials();
    } else {
        const spinner = ora('Signing into Materials...').start();
        const existingCredential = {username: existingCredentials[0].account, password: existingCredentials[0].password}
        const test = await testAuth(existingCredential)
        if (!test) {
            token = await askCredentials()
        } else {
            token = test
        }
        spinner.stop()
        spinner.clear()
        console.log(chalk.greenBright("✔ Successfully authenticated"))
    }
    existingCredentials = await keytar.findCredentials(id)

    const cookie = await authLegacy({
        username: existingCredentials[0].account,
        password: existingCredentials[0].password
    })
    const materialsLegacy = new MaterialsLegacy(cookie)

    if (!conf.has("folderPath")) {
        const folderPath = await setFolder()
        conf.set("folderPath", folderPath)
    }

    const materialsAPI = new MaterialsApi(token)
    const spinner = ora('Fetching courses...').start();
    const courses = await materialsAPI.getCourses()
    spinner.stop()
    spinner.clear()
    const courseNameChosen = await pickCourse(courses.data as Course[])
    const course = courses.data.find(x => x.title === courseNameChosen.course) as Course
    const spinner2 = ora('Fetching course materials...').start();
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    const nonLinkResources = resourcesResult.data.filter(x => x.type == 'file') as Resource[]
    spinner2.stop()
    spinner2.clear()
    console.log(chalk.greenBright(`Found ${nonLinkResources.length} resources!`))
    let downloadedFiles = 0;
    for (let i = 0; i < nonLinkResources.length; i++) {
        const downloaded = await materialsLegacy.downloadFile(nonLinkResources[i], nonLinkResources[i].index, conf.get("folderPath").folderPath, course.title)
        if(downloaded) {
            downloadedFiles++;
            console.log(chalk.greenBright("Downloaded " + nonLinkResources[i].title + "!"))
        }
    }
    if(downloadedFiles != 0) {
        console.log(chalk.greenBright(`Downloaded ${downloadedFiles} new resources!`))
    } else {
        console.log(chalk.greenBright("All resources downloaded, no new to pull!"))
    }
};

run();

