import { v4 as uuidv4 } from "uuid";
//@ts-ignore
import UserAgent from "user-agents";
import { parseJSON, toEventCB, toEventStream } from "../../utils/index.js";
import { Chat } from "../base.js";
import { CreateTlsProxy } from "../../utils/proxyAgent.js";

const userAgent = new UserAgent();

export class You extends Chat {
  session;

  constructor(props) {
    super(props);
    this.session = CreateTlsProxy({ clientIdentifier: "chrome_108" });
    this.session.headers = this.getHeaders();
  }

  async request(req) {
    let {
      page = 1,
      count = 10,
      safeSearch = "Moderate",
      onShoppingPage = "False",
      mkt = "",
      responseFilter = "WebPages,Translations,TimeZone,Computation,RelatedSearches",
      domain = "youchat",
      queryTraceId = null,
      chat = null,
      includeLinks = "False",
      detailed = "False",
      debug = "False",
    } = req.options || {};
    if (!chat) {
      chat = [];
    }
    return await this.session.get("https://you.com/api/streamingSearch", {
      params: {
        q: req.prompt,
        page: page + "",
        count: count + "",
        safeSearch: safeSearch + "",
        onShoppingPage: onShoppingPage + "",
        mkt: mkt + "",
        responseFilter: responseFilter + "",
        domain: domain + "",
        queryTraceId: queryTraceId || uuidv4(),
        chat: JSON.stringify(chat),
      },
    });
  }

  async askStream(req) {
    const response = await this.request(req);
    return { text: toEventStream(response.content), other: {} };
  }

  async ask(req) {
    const response = await this.request(req);
    return new Promise((resolve) => {
      const res = {
        text: "",
        other: {},
      };
      toEventCB(response.content, (eventName, data) => {
        let obj;
        switch (eventName) {
          case "youChatToken":
            obj = parseJSON(data, {});
            res.text += obj.youChatToken;
            break;
          case "done":
            resolve(res);
            return;
          default:
            obj = parseJSON(data, {});
            res.other[eventName] = obj;
            return;
        }
      });
    });
  }

  getHeaders() {
    return {
      authority: "you.com",
      accept: "text/event-stream",
      "accept-language":
        "en,fr-FR;q=0.9,fr;q=0.8,es-ES;q=0.7,es;q=0.6,en-US;q=0.5,am;q=0.4,de;q=0.3",
      "cache-control": "no-cache",
      referer: "https://you.com/search?q=who+are+you&tbm=youchat",
      "sec-ch-ua":
        '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie: `safesearch_guest=Moderate; uuid_guest=${uuidv4()}`,
      "user-agent": userAgent.toString(),
    };
  }
}
