import pptr from "puppeteer";
import ora from "ora";
import l_get from "lodash.get";
import l_set from "lodash.set";
import { TRANSLATE_ORIGIN } from "./origin";

async function _translate(
  page: pptr.Page,
  sl: string,
  tl: string,
  text: string
): Promise<string | undefined | null> {
  const gotoUrl = `${TRANSLATE_ORIGIN}/?sl=${sl}&tl=${tl}&text=${text}&op=translate`;
  await page.goto(gotoUrl);
  const span = await page.waitForSelector(".VIiyi");
  return span.evaluate(
    (it) => it.firstElementChild?.firstElementChild?.textContent
  );
}

/**
 *
 * @param source
 * @param sl
 * @param tl
 * @param paths
 */
export async function translate(
  source: any /* string | string[] | {} | {}[] */,
  sl: string,
  tl: string,
  paths?: string[]
): Promise<any> {
  const p = ora("translate...");
  p.start();
  const browser = await pptr.launch({
    headless: true,
    slowMo: 250,
  });

  const page = await browser.newPage();

  if (typeof source === "string") {
    const data = await _translate(page, sl, tl, source);
    if (data) source = data;
  }

  if (Array.isArray(source)) {
    for (let i = 0; i < source.length; i++) {
      let $_ = source[i];

      if (typeof $_ === "string") {
        const data = await _translate(page, sl, tl, $_);
        if (data) source[i] = data;
        continue;
      }

      if (paths && paths.length) {
        for (const $__ of paths) {
          const data = await _translate(page, sl, tl, l_get($_, $__));
          l_set($_, $__, data);
        }
      }
    }
  }

  if (Object.prototype.toString.call(source) === "[object Object]") {
    for (const k in source) {
      let v = source[k];
      if (typeof v === "string") {
        const data = await _translate(page, sl, tl, v);
        if (data) source[k] = data;
      } else if (typeof v === "object" && v !== null && paths && paths.length) {
        for (const dataPath of paths) {
          const data = await _translate(page, sl, tl, l_get(v, dataPath));
          l_set(v, dataPath, data);
        }
      }
    }
  }

  p.succeed("success.");
  browser.close();
  return source;
}
