#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import yargs from "yargs";
import JSON5 from "json5";
import { translate } from "./translate";

const argv = yargs
  .config()
  .option("path", {
    alias: "p",
    array: true,
    describe: "设置转换数据的属性路径",
  })
  .help("help").argv;

if (argv.h || argv._.length != 3) {
  console.log(`
  Example: zh-CN to en

  $ gt ./languages.json zh-CN en --path=name
  $ cat ./languages.en.json


  Example: en to ja

  $ gt ./msg.txt en ja
  $ cat msg.ja.txt


  $ gt ./app_en.arb en zh-CN --path=description
  $ cat app_en.zh-CN.arb
  `);
  process.exit();
}

const [s, sl, tl] = argv._ as string[];
const SS = fs.readFileSync(path.join(".", s)).toString("utf-8");
let source: any;
try {
  source = JSON5.parse(SS);
} catch (error) {
  source = SS;
}

translate(source, sl, tl, argv.path as string[]).then((t_source) => {
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
