import Configstore from "configstore";
import {Course} from "../utils/course";

class ConfigStore {

    conf: Configstore;

    constructor(id: string) {
        this.conf = new Configstore(id);
    }

    clearConfig() {
        this.conf.clear()
    }

    getFolderPath(): string | undefined {
        return this.conf.has("folderPath") ? this.conf.get("folderPath").folderPath: undefined
    }

    setFolderPath(folderPath: string) {
        this.conf.set("folderPath", folderPath)
    }

    getShortcuts(): Shortcuts {
        return this.conf.get("shortcuts") || {}
    }

    setShortcuts(shortcut: string, course: Course) {
        const currentShortcuts = this.getShortcuts();
        currentShortcuts[shortcut] = course;
        this.conf.set("shortcuts", currentShortcuts);
    }

}

export type Shortcuts = { [key: string]: Course };

export default ConfigStore;
