import { Chat } from "../base.js";
import { CreateAxiosProxy } from "../../utils/proxyAgent.js";
import es from "event-stream";
import { parseJSON } from "../../utils/index.js";

export class AiDream extends Chat {
  client;

  constructor(options) {
    super(options);
    this.client = CreateAxiosProxy({
      baseURL: "http://aidream.cloud/api/",
      headers: {
        "Cache-Control": "no-cache",
        "Proxy-Connection": "keep-alive",
      },
    });
  }

  async ask(req) {
    req.options.parse = false;
    const res = await this.askStream(req);
    const result = {
      text: "",
      other: {},
    };
    return new Promise((resolve) => {
      res.text
        .pipe(es.split(/\r?\n/))
        .pipe(
          es.map(async (chunk, cb) => {
            const data = parseJSON(chunk, {});
            if (!data?.detail?.choices) {
              cb(null, "");
              return;
            }
            const [
              {
                delta: { content },
              },
            ] = data.detail.choices;
            result.other.parentMessageId = data.parentMessageId;
            cb(null, content);
          })
        )
        .on("data", (data) => {
          result.text += data;
        })
        .on("close", () => {
          resolve(result);
        });
    });
  }

  async askStream(req) {
    const { prompt = "" } = req;
    const {
      systemMessage = "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.",
      temperature = 1.0,
      top_p = 1,
      parentMessageId,
      parse = true,
    } = req.options;
    const data = {
      options: { parentMessageId },
      prompt,
      systemMessage,
      temperature,
      top_p,
    };
    const res = await this.client.post("/chat-process", data, {
      responseType: "stream",
    });
    if (parse) {
      return {
        text: this.parseData(res.data),
      };
    }
    return { text: res.data };
  }

  parseData(v) {
    return v.pipe(es.split(/\r?\n/)).pipe(
      es.map(async (chunk, cb) => {
        const data = parseJSON(chunk, {});
        if (!data?.detail?.choices) {
          cb(null, "");
          return;
        }
        const [
          {
            delta: { content },
          },
        ] = data.detail.choices;
        cb(null, content);
      })
    );
  }
}
