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
