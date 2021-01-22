import * as path from "path";
import * as fs from "fs";
import pptr from "puppeteer";
import ora from "ora";
import { TRANSLATE_ORIGIN } from "./origin";

export interface LanguageItem {
  name: string;
  code: string;
}

export async function getLangugeCode(): Promise<LanguageItem[]> {
  const p = ora("get languages...");
  p.start();
  const browser = await pptr.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(TRANSLATE_ORIGIN);
  const span = await page.waitForSelector(".SL5JTc", {
    hidden: true,
  });
  const languages = await span.evaluate((it) => {
    const rPx1uf = it.lastElementChild;
    return Array.from(rPx1uf?.querySelectorAll(".ordo2") ?? []).map((it) => {
      return {
        code: it.getAttribute("data-language-code") ?? "??",
        name: it.querySelector(".PxXj2d")?.textContent ?? "??",
      };
    });
  });
  p.succeed("success.");
  await browser.close();
  return languages;
}

export async function saveLanguages(languages?: LanguageItem[]) {
  if (!languages) languages = await getLangugeCode();
  const sp = path.join("./", "languages.json");

  const p = ora("save...");
  p.start();
  try {
    fs.writeFileSync(sp, JSON.stringify(languages, null, "  "));
    p.succeed("success.");
    console.log(`cat ${sp}`);
  } catch (error) {
    p.fail("fail.");
    console.log(`save error: %s`, error.message);
  }
}
