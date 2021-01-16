import chalk from "chalk";
import figlet from "figlet";

export function startUp() {
    console.log(
        chalk.green(
            figlet.textSync('Materials CLI')
        )
    );
}
