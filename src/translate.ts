import pptr from "puppeteer";
import ora from "ora";
import l_get from "lodash.get";
import l_set from "lodash.set";
import * as qs from "querystring";

abstract class Translate {
  abstract getValue(
    page: pptr.Page,
    sl: string,
    tl: string,
    text: string
  ): Promise<string | undefined | null>;

  async translate(
    source: any /* string | string[] | {} | {}[] */,
    sl: string,
    tl: string,
    options?: {
      headless?: boolean;
      paths?: string[];
      loading?: boolean;
    }
  ): Promise<any> {
    if (!options) options = {};
    let p: ora.Ora | undefined;
    if (options.loading) p = ora("translate...").start();

    const browser = await pptr.launch({
      headless: options.headless ?? true,
      slowMo: 250,
    });
    browser.on("targetdestroyed", () => {
      if (p) p.fail();
    });

    try {
      const page = await browser.newPage();

      if (typeof source === "string") {
        source = await this.getValue(page, sl, tl, source);
      }

      if (Array.isArray(source)) {
        for (let i = 0; i < source.length; i++) {
          let $_ = source[i];

          if (typeof $_ === "string") {
            source[i] = await this.getValue(page, sl, tl, $_);
            continue;
          }

          if (options.paths && options.paths.length) {
            for (const $__ of options.paths) {
              const data = await this.getValue(page, sl, tl, l_get($_, $__));
              l_set($_, $__, data);
            }
          }
        }
      }

      if (Object.prototype.toString.call(source) === "[object Object]") {
        for (const k in source) {
          let v = source[k];
          if (typeof v === "string") {
            const data = await this.getValue(page, sl, tl, v);
            if (data) source[k] = data;
          } else if (
            typeof v === "object" &&
            v !== null &&
            options.paths &&
            options.paths.length
          ) {
            for (const dataPath of options.paths) {
              const data = await this.getValue(
                page,
                sl,
                tl,
                l_get(v, dataPath)
              );
              l_set(v, dataPath, data);
            }
          }
        }
      }

      if (p) p.succeed("success.");
      browser.close();
      return source;
    } catch (error) {
      if (p) p.fail(error.message);
      browser.close();
    }
  }
}

export class GoogleTranslate extends Translate {
  origin = "https://translate.google.cn";

  async getValue(
    page: pptr.Page,
    sl: string,
    tl: string,
    text: string
  ): Promise<string> {
    const gotoUrl = `${this.origin}/?sl=${sl}&tl=${tl}&text=${text}&op=translate`;
    await page.goto(gotoUrl);
    const span = await page.waitForSelector(".VIiyi");
    const value = await span.evaluate(
      (it) => it.firstElementChild?.firstElementChild?.textContent
    );
    if (!value) return text;
    return value;
  }
}

export class BaiduTranslate extends Translate {
  origin = "https://fanyi.baidu.com";
  async getValue(
    page: pptr.Page,
    sl: string,
    tl: string,
    text: string
  ): Promise<string> {
    return new Promise(async (_res) => {
      page.on("response", async (res) => {
        if (res.url().includes("v2transapi")) {
          setTimeout(async () => {
            const value = await page
              .$(".target-output")
              .then((it) =>
                it?.evaluate((p) => p.firstElementChild?.textContent)
              );
            page.removeAllListeners();
            _res(value ?? text);
          });
        }
      });

      if (!page.url().startsWith('http')) {
        const gotoUrl = `${this.origin}/#${sl}/${tl}/${text}`;
        await page.goto(gotoUrl);
      } else {
        await page.$eval(
          "#baidu_translate_input",
          (e: any, v) => (e.value = v),
          text
        );
        page.click("#translate-button");
      }
    });
  }
}

export class YouDaoTranslate extends Translate {
  origin = "http://fanyi.youdao.com";

  async getValue(
    page: pptr.Page,
    sl: string,
    tl: string,
    text: string
  ): Promise<string> {
    return new Promise(async (_res) => {
      const gotoUrl = this.origin;

      page.on("request", async (req) => {
        if (
          req.url().includes("translate_o") &&
          req.method().toLowerCase() === "post"
        ) {
          const pd = qs.parse(req.postData() ?? "");
          pd.from = sl;
          pd.to = tl;
          req.continue({
            postData: qs.stringify(pd),
          });
        } else {
          req.continue();
        }
      });
      page.on("response", async (res) => {
        if (res.url().includes("translate_o")) {
          const { translateResult }: any = await res.json();
          page.removeAllListeners();
          page.setRequestInterception(false);
          if (translateResult && translateResult.length) {
            const value = translateResult[0][0].tgt;
            _res(value);
          } else {
            _res(text);
          }
        }
      });
      await page.setRequestInterception(true);
      await page.goto(gotoUrl);
      await page.$eval("#inputOriginal", (el: any, v) => (el.value = v), text);
      page.click("#transMachine");
    });
  }
}

export class BingTranslate extends Translate {
  origin = "https://www.bing.com/translator/?mkt=zh-CN";

  async getValue(
    page: pptr.Page,
    sl: string,
    tl: string,
    text: string
  ): Promise<string> {
    return new Promise(async (_res) => {
      const gotoUrl = this.origin;

      page.on("request", async (req) => {
        if (
          req.url().includes("ttranslate") &&
          req.method().toLowerCase() === "post"
        ) {
          const pd = qs.parse(req.postData() ?? "");
          pd.fromLang = sl;
          pd.to = tl;
          req.continue({
            postData: qs.stringify(pd),
          });
        } else {
          req.continue();
        }
      });
      page.on("response", async (res) => {
        if (res.url().includes("ttranslate")) {
          page.removeAllListeners();
          page.setRequestInterception(false);
          const r: any = await res.json();
          if (r && r.length) {
            const value = r[0].translations[0].text;
            _res(value);
          } else {
            _res(text);
          }
        }
      });
      await page.setRequestInterception(true);
      await page.goto(gotoUrl);
      await page.$eval(
        "#tta_input_ta",
        (el: any, v) => (el.value = v),
        text.slice(0, -1)
      );
      page.type("#tta_input_ta", text.slice(-1));
    });
  }
}

export const translates = {
  google: new GoogleTranslate(),
  baidu: new BaiduTranslate(),
  youdao: new YouDaoTranslate(),
  bing: new BingTranslate(),
};
