#!/usr/bin/env node

import ora from "ora";
import chalk from "chalk";
import updateNotifier from "update-notifier";
import {ArgumentParser} from "argparse";
import {askCredentials, pickCourse, setFolder} from "./lib/inquirer";
import MaterialsApi, {testAuth} from "./lib/materials-api";
import MaterialsLegacy from "./lib/materials-legacy";
import Keystore from "./lib/keystore";
import ConfigStore from "./lib/configstore";
import ConcurrentDownloader from "./lib/concurrent-downloader";
import {startUp} from "./utils/startup";
import {Course} from "./utils/course";
import {Resource} from "./utils/resource";
import {CredentialsAndToken} from "./utils/credentials";
import {id} from "./utils/config";

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

    const materialsLegacy = new MaterialsLegacy()
    await materialsLegacy.authLegacy(tokenAndCredentials.credentials)

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

    const spinner2 = ora('Fetching course materials...').start();
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    const nonLinkResources = resourcesResult.data.filter(x => x.type == 'file') as Resource[]
    let folderPath = conf.getFolderPath();
    spinner2.stop()
    spinner2.clear()
    console.log(chalk.greenBright(`Found ${nonLinkResources.length} resources!`))
    const concurrentDownloader = new ConcurrentDownloader(materialsLegacy, course.title, folderPath)
    concurrentDownloader.scheduleDownloads(nonLinkResources)
    await concurrentDownloader.executeDownloads()
};

run();

