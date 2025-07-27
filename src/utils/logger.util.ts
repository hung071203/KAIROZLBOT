import chalk from "chalk";

type LogLevel = "info" | "warn" | "error" | "debug";

const levelColors: Record<LogLevel, chalk.Chalk> = {
  info: chalk.blueBright,
  warn: chalk.yellowBright,
  error: chalk.redBright,
  debug: chalk.greenBright,
};

function log(level: LogLevel, message: string) {
  const time = chalk.gray(new Date().toLocaleTimeString("en-US", { hour12: false }));
  const levelLabel = levelColors[level](level.toUpperCase().padEnd(5));
  console.log(`${levelLabel} - ${time} - ${message}`);
}

export const Logger = {
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),
  debug: (msg: string) => log("debug", msg),
};
