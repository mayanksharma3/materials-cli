#!/usr/bin/env node

import {askCredentials, pickCourse, promptOpenFolder, setFolder} from "./lib/inquirer";
import keytar from "keytar";
import Configstore from "configstore";
import MaterialsApi, {testAuth} from "./lib/materials-api";
import {startUp} from "./utils/startup";
import {Course} from "./utils/course";
import chalk from "chalk";
import {Resource} from "./utils/resource";
import MaterialsLegacy, {authLegacy} from "./lib/materials-legacy";
import {id, year} from "./utils/config";
import {deleteCredentials} from "./utils/credentials";
import ora from "ora";
import open from "open";
import Listr from "listr";
import * as path from "path";
import fs from "fs";
import {ArgumentParser} from "argparse";
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const version = pkg.version;
const notifier = updateNotifier({pkg, updateCheckInterval: 0});

const parser = new ArgumentParser({
    description: 'Materials CLI Tool'
});

parser.add_argument('shortcut', {nargs: "?", help: "Shortcut to course"})
parser.add_argument('-v', '--version', {action: 'version', version});
parser.add_argument('-c', '--clean', {action: 'store_true', help: "Clean configurations"});

const argv = parser.parse_args();

const run = async () => {
    startUp(pkg.version)
    notifier.notify();

    const conf = new Configstore(id);

    if (argv.clean) {
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

    // Successfully authenticated

    const currentShortcuts: { [key: string]: Course } = conf.get("shortcuts") || {}

    let course: Course | undefined;
    const shortCutArg = argv.shortcut;
    if (shortCutArg) {
        course = currentShortcuts[shortCutArg];
    }

    if (!course) {
        const spinner = ora('Fetching courses...').start();
        const courses = await materialsAPI.getCourses()
        spinner.stop()
        spinner.clear()
        if (shortCutArg) {
            console.log(chalk.yellow(`No course found for shortcut ${shortCutArg}, assign one below:`))
        }
        const courseNameChosen = await pickCourse(courses.data as Course[])
        if (shortCutArg) {
            console.log(chalk.yellow(`Shortcut ${shortCutArg}, assigned to ${courseNameChosen.course}!`))
        }
        course = courses.data.find(x => x.title === courseNameChosen.course) as Course
        if (shortCutArg) {
            currentShortcuts[shortCutArg] = course;
            conf.set("shortcuts", currentShortcuts);
        }
    } else {
        console.log(chalk.blueBright(course.title))
    }

    const spinner2 = ora('Fetching course materials...').start();
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    const nonLinkResources = resourcesResult.data.filter(x => x.type == 'file') as Resource[]
    let folderPath = conf.get("folderPath").folderPath;
    spinner2.stop()
    spinner2.clear()
    console.log(chalk.greenBright(`Found ${nonLinkResources.length} resources!`))
    let downloadedFiles = 0;
    const tasks = []
    for (let i = 0; i < nonLinkResources.length; i++) {
        let currentResource = nonLinkResources[i];
        const filePath = path.join(folderPath, course.title, currentResource.category, currentResource.title)
        if (!fs.existsSync(filePath)) {
            tasks.push({
                title: "Downloading " + currentResource.title,
                task: async () => {
                    const downloaded = await materialsLegacy.downloadFile(currentResource, currentResource.index, folderPath, course.title)
                    if (downloaded) {
                        downloadedFiles++;
                    }
                }
            })
        }

    }
    if (tasks.length !== 0) {
        const listr = new Listr(tasks, {concurrent: true})
        listr.run().catch(err => {
            console.error(err);
        }).then(async () => {
            if (downloadedFiles != 0) {
                console.log(chalk.greenBright(`Downloaded ${downloadedFiles} new resources!`))
                const openFolderResponse = await promptOpenFolder()
                if (openFolderResponse.openFolder) {
                    await open(path.join(folderPath, course.title))
                }
            }

        });
    } else {
        console.log(chalk.greenBright("All resources already downloaded, no new to pull!"))
    }

};

run();

