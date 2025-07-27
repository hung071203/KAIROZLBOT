import chalk from "chalk";

type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const levelColors: Record<LogLevel, chalk.Chalk> = {
    info: chalk.blueBright,
    warn: chalk.yellowBright,
    error: chalk.redBright,
    debug: chalk.greenBright,
    success: chalk.cyanBright, // or chalk.greenBright if you prefer
};

function log(level: LogLevel, ...args: any[]) {
    const time = chalk.gray(new Date().toLocaleTimeString("en-US", { hour12: false }));
    const levelLabel = levelColors[level](level.toUpperCase().padEnd(7));
    console.log(`${levelLabel}- ${time} -`, ...args);
}

export const Logger = {
    info: (...args: any[]) => log("info", ...args),
    warn: (...args: any[]) => log("warn", ...args),
    error: (...args: any[]) => log("error", ...args),
    debug: (...args: any[]) => log("debug", ...args),
    success: (...args: any[]) => log("success", ...args),
};
