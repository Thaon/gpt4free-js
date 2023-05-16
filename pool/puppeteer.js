import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const runPath = path.join("./run");

export class FreeBrowser {
  browser = undefined;
  options;
  urls = new Set();
  pages = {};
  id;

  constructor(id, options) {
    this.options = {
      userDataDir: path.join(runPath, id),
      ...options,
    };
    this.id = id;
  }

  async init() {
    this.browser = await puppeteer.launch(this.options);
  }

  async getPage(url) {
    if (!this.browser) {
      throw new Error("Browser must init first");
    }
    if (this.pages[url]) {
      return this.pages[url];
    }
    const page = await this.browser.newPage();
    await page.goto(url);

    this.pages[url] = page;
    return page;
  }
}

class FreeBrowserPool {
  size = 0;
  pool;

  constructor() {
    this.pool = [];
  }

  async init(size, debug) {
    console.log(`browser pool init size:${size}`);
    if (!fs.existsSync(runPath)) {
      fs.mkdirSync(runPath);
    }
    this.size = size;
    const options = {
      headless: !debug,
    };
    for (let i = 0; i < size; i++) {
      const browser = new FreeBrowser(`${i}`, options);
      await browser.init();
      this.pool.push(browser);
    }
  }

  getRandom() {
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }
}

export const freeBrowserPool = new FreeBrowserPool();
