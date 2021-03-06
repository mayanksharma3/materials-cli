#!/usr/bin/env node

import ora from "ora";
import chalk from "chalk";
import updateNotifier from "update-notifier";
import {ArgumentParser} from "argparse";
import {askCredentials, pickCourse, setFolder} from "./lib/inquirer";
import MaterialsApi, {testAuth} from "./lib/materials-api";
import Keystore from "./lib/keystore";
import ConfigStore from "./lib/configstore";
import ConcurrentDownloader from "./lib/concurrent-downloader";
import {intro, startUp} from "./utils/startup";
import {Course} from "./utils/course";
import {Resource, ResourceWithLink} from "./utils/resource";
import {CredentialsAndToken} from "./utils/credentials";
import {id} from "./utils/config";
import path from "path";
import open from "open";

const pkg = require('../package.json');
const version = pkg.version;
const notifier = updateNotifier({pkg, updateCheckInterval: 0});

const parser = new ArgumentParser({
    description: 'Materials CLI Tool'
});

parser.add_argument('shortcut', {nargs: "?", help: "Shortcut to course"})
parser.add_argument('-v', '--version', {action: 'version', version});
parser.add_argument('-c', '--clean', {action: 'store_true', help: "Clean configurations"});
parser.add_argument('-o', '--open', {action: 'store_true', help: "Open folder based off shortcut or selection"});
parser.add_argument('-d', '--dir', {action: 'store_true', help: "Save folders in current directory instead"});
parser.add_argument('-a', '--all', {action: 'store_true', help: "Download all shortcut courses one go"});
const argv = parser.parse_args();

const run = async () => {
    startUp(pkg.version)
    notifier.notify();
    const keystore = new Keystore();
    const conf = new ConfigStore(id);

    if (argv.clean) {
        await keystore.deleteCredentials()
        conf.clearConfig()
        console.log(chalk.greenBright("Configuration cleared!"))
        return;
    }

    let existingCredentials = await keystore.getCredentials()

    let tokenAndCredentials: CredentialsAndToken

    if (!existingCredentials) {
        intro()
        tokenAndCredentials = await askCredentials();
        await keystore.setCredentials(tokenAndCredentials.credentials)
    } else {
        const spinner = ora('Signing into Materials...').start();
        const newToken = await testAuth(existingCredentials)
        if (!newToken) {
            tokenAndCredentials = await askCredentials();
            await keystore.setCredentials(tokenAndCredentials.credentials)
        } else {
            tokenAndCredentials = {credentials: existingCredentials, token: newToken}
        }
        spinner.stop()
        spinner.clear()
        console.log(chalk.greenBright("✔ Successfully authenticated"))
    }

    if (!conf.getFolderPath()) {
        const folderPath = await setFolder()
        conf.setFolderPath(folderPath)
    }

    const materialsAPI = new MaterialsApi(tokenAndCredentials.token)

    // Successfully authenticated

    const currentShortcuts = conf.getShortcuts()

    let course: Course | undefined;
    const shortCutArg = argv.shortcut;
    if (shortCutArg) {
        course = currentShortcuts[shortCutArg];
    }

    if(argv.all) {
        const shortcuts = Object.keys(currentShortcuts);
        for (let i = 0; i < shortcuts.length; i++) {
            let course = currentShortcuts[shortcuts[i]]
            await downloadCourse(course, materialsAPI, shortCutArg, conf, argv.open, false);
        }
    } else {
        await downloadCourse(course, materialsAPI, shortCutArg, conf, argv.open);
    }

};

async function downloadCourse(course: Course, materialsAPI: MaterialsApi, shortCutArg, conf: ConfigStore, argvOpenFolder: boolean, openFolder: boolean = true, ) {
    let folderPath = argv.dir ? process.cwd() : conf.getFolderPath();
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
            conf.setShortcuts(shortCutArg, course)
        }
    } else {
        console.log(chalk.blueBright(course.title))
    }

    if(argvOpenFolder) {
        await open(path.join(folderPath, course.title))
        return;
    }

    const spinner2 = ora('Fetching course materials...').start();
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    // .map is a hack to ensure the extension is always added
    const nonLinkResources = resourcesResult.data.filter(x => x.type == 'file').map(x => {
        x.title = path.parse(x.title).name + path.parse(x.path).ext
        return x
    }) as Resource[]
    const pdfLinkResources = resourcesResult.data.filter(x => x.type == 'link' && x.path.endsWith(".pdf")) as ResourceWithLink[]
    spinner2.stop()
    spinner2.clear()
    console.log(chalk.greenBright(`Found ${nonLinkResources.length + pdfLinkResources.length} resources!`))
    const concurrentDownloader = new ConcurrentDownloader(materialsAPI, course.title, folderPath)
    concurrentDownloader.scheduleDownloads(nonLinkResources)
    concurrentDownloader.scheduleLinkDownloads(pdfLinkResources)
    await concurrentDownloader.executeDownloads(openFolder)
}

run();

