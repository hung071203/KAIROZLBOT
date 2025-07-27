import chalk from "chalk";
import config from "../configs/config.json";
const logging = config.logging

type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const levelColors: Record<LogLevel, chalk.Chalk> = {
    info: chalk.blueBright,
    warn: chalk.yellowBright,
    error: chalk.redBright,
    debug: chalk.greenBright,
    success: chalk.cyanBright, // or chalk.greenBright if you prefer
};

function log(level: LogLevel, ...args: any[]) {
    // Chỉ log nếu level được cấu hình trong config.logging
    if (!logging.includes(level)) {
        return;
    }
    
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
