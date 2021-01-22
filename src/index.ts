#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import yargs from "yargs";
import JSON5 from "json5";
import { translates } from "./translate";

const DEFAULT_ORIGIN = "google";

const argv = yargs
  .config()
  .option("path", {
    alias: "p",
    array: true,
    description: "object prop path",
  })
  .option("origin", {
    alias: "o",
    default: DEFAULT_ORIGIN,
    description: "google | baidu | youdao | bing",
  })
  .option("headless", {
    boolean: true,
    default: true,
    alias: "hl",
    description: "无头模式",
  })
  .help("help").argv;

function checkOrigin(origin: string): origin is keyof typeof translates {
  if (translates.hasOwnProperty(origin)) return true;
  else throw "error origin: " + origin;
}

async function main() {
  if (argv._.length !== 3) process.exit();

  const [s, sl, tl] = argv._ as string[];
  const SS = fs.readFileSync(path.join(".", s)).toString("utf-8");
  let source: any;
  try {
    source = JSON5.parse(SS);
  } catch (error) {
    source = SS;
  }

  if (checkOrigin(argv.origin)) {
    translates[argv.origin]
      .translate(source, sl, tl, argv.headless, argv.path as string[])
      .then((t_source: any) => {
        const spp = path.parse(s);
        const sp = path.join("./", `${spp.name}.${tl}${spp.ext}`);
        try {
          const sData =
            typeof t_source === "string"
              ? t_source
              : JSON.stringify(t_source, null, "  ");
          fs.writeFileSync(sp, sData);
          console.log(`$ cat ${sp}`);
        } catch (error) {
          console.log(`save error: %s`, error.message);
        }
      });
  }
}

main();
