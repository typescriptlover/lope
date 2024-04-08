import chalk from "chalk";

type LogType = "info" | "warn" | "error";

function replaceCodeSnippet(message: string) {
   return message.replace(
      /''([^'\\]*(?:\\.[^'\\]*)*)''/gi,
      chalk.bgBlackBright("$1"),
   );
}

export default function log(type: LogType, message: string) {
   const typeColor: Record<LogType, any> = {
      info: chalk.blue,
      warn: chalk.hex("#FFA500"),
      error: chalk.red,
   };

   const longestTypeLength = Object.keys(typeColor).sort(
      (a, b) => b.length - a.length,
   )[0].length;

   console.log(
      `${chalk.magenta("lope")}${chalk.gray.dim(":")}${typeColor[type](type)} ${" ".repeat(longestTypeLength - type.length)}${chalk.gray.dim("|")} ${replaceCodeSnippet(message)}`,
   );
}
