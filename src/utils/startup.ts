import chalk from "chalk";
import figlet from "figlet";

export function startUp() {
    console.log(
        chalk.green(
            figlet.textSync('Materials CLI')
        )
    );
    console.log(chalk.green("Welcome to Materials CLI!"))
}
