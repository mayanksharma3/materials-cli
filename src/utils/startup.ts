import chalk from "chalk";
import figlet from "figlet";

export function startUp(version: number) {
    console.log(
        chalk.green(
            figlet.textSync('Materials CLI')
        )
    );
    console.log(chalk.green("Materials CLI v" + version))
}


export function intro() {
    console.log(("Features: "))
    console.log(("- Auto download resources for courses from terminal"))
    console.log(("- Auto login (after first call) to quickly access resources"))
    console.log(("- Only pulls new resources, so you don't need to find which ones are new"))
    console.log(("- Shortcuts to quickly access your main courses"))

    console.log(chalk.greenBright("To get started, first login using your Imperial shortcode and password"))

}
