import inquirer from "inquirer";
import {testAuth} from "./materials-api";
import chalk from "chalk";
import Fuse from 'fuse.js'
import {Course} from "../utils/course";
import {CredentialsAndToken} from "../utils/credentials";
import * as path from "path";

export async function askCredentials(): Promise<CredentialsAndToken> {
    const questions = [
        {
            name: 'username',
            type: 'input',
            message: 'Enter your Imperial Shortcode:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your Imperial Shortcode';
                }
            }
        },
        {
            name: 'password',
            type: 'password',
            message: 'Enter your password:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your password.';
                }
            }
        }
    ];
    const response = await inquirer.prompt(questions);
    const token = await testAuth(response);
    if (token) {
        console.log(chalk.greenBright("Successfully authenticated!"))
        return {token: token, credentials: response};
    } else {
        console.log(chalk.redBright("Incorrect username or password, please try again!"))
        return askCredentials()
    }
}


export async function pickCourse(list: Course[]) {
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

    const questions = [
        {
            name: 'course',
            type: 'autocomplete',
            message: 'Pick course:',
            source: (_, input) => {
                if (input) {
                    const options = {
                        includeScore: true,
                        keys: ['title', 'code']
                    }
                    const fuse = new Fuse(list, options)
                    const result = fuse.search(input)
                    return result.map(x => x.item.title)
                } else {
                    return list.map(x => x.title)
                }
            },
            validate: function (value) {
                const course = list.find(x => x.title === value.name) as Course
                if (course.has_materials) {
                    return true;
                } else {
                    return 'This course has no materials, sorry!';
                }
            }

        }
    ];
    return inquirer.prompt(questions);
}

export async function setFolder() {
    const questions = [
        {
            name: 'folderPath',
            type: 'input',
            default: path.join(require("os").homedir(), "Documents", "Materials"),
            message: 'Enter the path for saving all material:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter the path for saving all material:';
                }
            }
        }
    ];
    return inquirer.prompt(questions);
}

export async function promptOpenFolder() {
    const questions = [
        {
            name: 'openFolder',
            type: 'confirm',
            default: true,
            message: 'Open Folder?'
        }
    ];
    return inquirer.prompt(questions);
}
