import { Chat } from "../base.js";
import { freeBrowserPool } from "../../pool/puppeteer.js";
import { Stream } from "stream";

export class Phind extends Chat {
  browser;
  page = undefined;

  constructor(options) {
    super(options);
  }

  async ask(req) {
    return Promise.resolve({ text: "" });
  }

  async askStream(req) {
    if (!this.browser) {
      this.browser = freeBrowserPool.getRandom();
    }
    if (!this.page) {
      this.page = await this.browser.getPage("https://phind.com");
      await this.page.setViewport({ width: 1920, height: 1080 });
      // await this.page.waitForNavigation();
    }

    // await this.page.waitForSelector('.col-md-10 > .container-xl > .mb-3 > .input-group > .form-control')
    // await this.page.click('.col-md-10 > .container-xl > .mb-3 > .input-group > .form-control')
    // todo complete
    return Promise.resolve({ text: new Stream() });
  }
}
