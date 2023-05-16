import { Chat } from "../base.js";
import { freeBrowserPool } from "../../pool/puppeteer.js";
import { CreateEmail } from "../../utils/emailFactory.js";
import { CreateTlsProxy } from "../../utils/proxyAgent.js";
import { PassThrough } from "stream";

export class Forefrontnew extends Chat {
  browser;
  page = undefined;
  url = "https://chat.forefront.ai/";
  writing = undefined;

  constructor(options) {
    super(options);
  }

  async ask(req) {
    const res = await this.askStream(req);
    let text = "";
    return new Promise((resolve) => {
      res.text
        .on("data", (data) => {
          if (!data) {
            return;
          }
          text += data;
        })
        .on("close", () => {
          resolve({ text, other: res.other });
        });
    });
  }

  async askStream(req) {
    if (this.writing) {
      const pt = new PassThrough();
      pt.write("Other conversation");
      pt.end();
      return { text: pt };
    }
    await freeBrowserPool.init(1, false);
    if (!this.browser) {
      this.browser = freeBrowserPool.getRandom();
    }
    let needRegister = false;
    if (!this.page) {
      this.page = await this.browser.getPage(this.url);
      await this.page.setViewport({ width: 1920, height: 1080 });
    }
    if (this.page.url() !== this.url) {
      await this.page.goto(this.url);
    }
    try {
      console.log("try find text input");
      await this.page.waitForSelector(
        ".relative > .flex > .w-full > .text-th-primary-dark > div",
        { timeout: 10000 }
      );
    } catch (e) {
      console.log("not found text input.");
      console.log("try register");
      await this.page.waitForSelector(
        ".cl-rootBox > .cl-card > .cl-footer > .cl-footerAction > .cl-footerActionLink",
        { timeout: 10000 }
      );
      await this.page.click(
        ".cl-rootBox > .cl-card > .cl-footer > .cl-footerAction > .cl-footerActionLink"
      );
      await this.page.waitForSelector("#emailAddress-field");
      await this.page.click("#emailAddress-field");

      await this.page.waitForSelector(
        ".cl-rootBox > .cl-card > .cl-main > .cl-form > .cl-formButtonPrimary"
      );
      await this.page.click(
        ".cl-rootBox > .cl-card > .cl-main > .cl-form > .cl-formButtonPrimary"
      );

      const emailBox = CreateEmail("temp-email44");
      const emailAddress = await emailBox.getMailAddress();
      // 将文本键入焦点元素
      await this.page.keyboard.type(emailAddress, { delay: 10 });
      await this.page.keyboard.press("Enter");

      const msgs = await emailBox.waitMails();
      let validateURL;
      for (const msg of msgs) {
        validateURL = msg.content.match(
          /https:\/\/clerk\.forefront\.ai\/v1\/verify\?token=[^\s"]+/i
        )?.[0];
        if (validateURL) {
          break;
        }
      }
      if (!validateURL) {
        throw new Error("Error while obtaining verfication URL!");
      }
      const tsl = await CreateTlsProxy({ clientIdentifier: "chrome_108" }).get(
        validateURL
      );
      console.log("register successfully");
      await this.page.waitForSelector(
        ".flex > .modal > .modal-box > .flex > .px-3:nth-child(1)",
        { timeout: 10000 }
      );
      await this.page.click(
        ".flex > .modal > .modal-box > .flex > .px-3:nth-child(1)"
      );
      await this.page.waitForSelector(
        ".relative > .flex > .w-full > .text-th-primary-dark > div",
        { timeout: 10000 }
      );
      console.log("try save cookie");
      console.log("save cookie successfully");
    } finally {
      const se = await this.page.$("#model-select");
      if (se) {
        await this.page.click("#model-select");
        await this.page.select("#model-select", "gpt-4");
      }
    }
    console.log("try to find input");
    await this.page.waitForSelector(
      ".relative > .flex > .w-full > .text-th-primary-dark > div",
      {
        timeout: 10000,
        visible: true,
      }
    );
    console.log("found");
    await this.page.click(
      ".relative > .flex > .w-full > .text-th-primary-dark > div"
    );
    await this.page.focus(
      ".relative > .flex > .w-full > .text-th-primary-dark > div"
    );
    await this.page.keyboard.type(req.prompt, { delay: 10 });
    await this.page.keyboard.press("Enter");
    await this.page.waitForSelector(
      "#__next > .flex > .relative > .relative > .flex-1"
    );
    // find markdown list container
    const mdList = await this.page.$(
      "#__next > .flex > .relative > .relative > .flex-1"
    );
    const md = mdList;
    // get latest markdown id
    const id = await md?.evaluate((el) => el.children.length);
    console.log(id);
    const selector = `.flex-1 > .flex:nth-child(${id}) > .relative > .grid > .post-markdown`;
    await this.page.waitForSelector(selector);
    const result = await this.page.$(selector);
    // get latest markdown text
    let oldText = "";
    const pt = new PassThrough();
    (async () => {
      const itl = setInterval(async () => {
        const text = await result?.evaluate((el) => {
          return el.textContent;
        });
        if (typeof text != "string") {
          return;
        }
        if (oldText.length === text.length) {
          return;
        }
        pt.write(text.slice(oldText.length - text.length));
        oldText = text;
      }, 100);
      if (!this.page) {
        return;
      }
      try {
        await this.page.waitForSelector(
          `.flex-1 > .flex:nth-child(${id}) > .relative > .grid > .opacity-100`
        );
        const text = await result?.evaluate((el) => {
          console.log(el);
          return el.textContent;
        });
        pt.write(text.slice(oldText.length - text.length));
      } finally {
        pt.end();
        clearInterval(itl);
      }
    })().then();
    return { text: pt };
  }
}
