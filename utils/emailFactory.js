import { md5, randomStr } from "./index.js";
import { CreateAxiosProxy } from "./proxyAgent.js";

// export enum TempEmailType {
//     // need credit card https://rapidapi.com/Privatix/api/temp-mail
//     TempEmail = 'temp-email',
//     // not need credit card , hard limit 100/day https://rapidapi.com/calvinloveland335703-0p6BxLYIH8f/api/temp-mail44
//     TempEmail44 = 'temp-email44',
// }

// export interface BaseMailMessage {
//     // main content of email
//     content: string;
// }

// export interface TempMailMessage extends BaseMailMessage {
//     _id: {
//         oid: string;
//     };
//     createdAt: {
//         milliseconds: number;
//     };
//     mail_id: string;
//     mail_address_id: string;
//     mail_from: string;
//     mail_subject: string;
//     mail_preview: string;
//     mail_text_only: string;
//     mail_text: string;
//     mail_html: string;
//     mail_timestamp: number;
//     mail_attachments_count: number;
//     mail_attachments: {
//         attachment[];
//     };
// }

// interface BaseOptions {
// }

// export interface TempMailOptions extends BaseOptions {
//     apikey?: string;
// }

export function CreateEmail(tempMailType, options) {
  switch (tempMailType) {
    case "temp-email44":
      return new TempMail44(options);
    case "temp-email":
      return new TempMail(options);
    default:
      throw new Error("not support TempEmailType");
  }
}

class BaseEmail {
  constructor(options) {}

  getMailAddress() {}

  waitMails() {}
}

class TempMail extends BaseEmail {
  client;
  address;
  mailID;

  constructor(options) {
    super(options);
    const apikey = options?.apikey || process.env.rapid_api_key;
    if (!apikey) {
      throw new Error("Need apikey for TempMail");
    }
    this.client = CreateAxiosProxy({
      baseURL: "https://privatix-temp-mail-v1.p.rapidapi.com/request/",
      headers: {
        "X-RapidAPI-Key": apikey,
        "X-RapidAPI-Host": "privatix-temp-mail-v1.p.rapidapi.com",
      },
    });
  }

  async getMailAddress() {
    this.address = `${randomStr()}${await this.randomDomain()}`;
    this.mailID = md5(this.address);
    return this.address;
  }

  async waitMails() {
    const mailID = this.mailID;
    return new Promise((resolve) => {
      let time = 0;
      const itl = setInterval(async () => {
        const response = await this.client.get(`/mail/id/${mailID}`);
        if (response.data && response.data.length > 0) {
          resolve(
            response.data.map((item) => ({ ...item, content: item.mail_html }))
          );
          clearInterval(itl);
          return;
        }
        if (time > 5) {
          resolve([]);
          clearInterval(itl);
          return;
        }
        time++;
      }, 5000);
    });
  }

  async getDomainsList() {
    const res = await this.client.get(`/domains/`);
    return res.data;
  }

  async randomDomain() {
    const domainList = await this.getDomainsList();
    return domainList[Math.floor(Math.random() * domainList.length)];
  }
}

class TempMail44 extends BaseEmail {
  client;
  address;

  constructor(options) {
    super(options);
    const apikey = options?.apikey || process.env.rapid_api_key;
    if (!apikey) {
      throw new Error("Need apikey for TempMail");
    }
    this.client = CreateAxiosProxy({
      baseURL: "https://temp-mail44.p.rapidapi.com/api/v3/email/",
      headers: {
        "X-RapidAPI-Key": apikey,
        "X-RapidAPI-Host": "temp-mail44.p.rapidapi.com",
      },
    });
  }

  async getMailAddress() {
    const response = await this.client.post(
      "/new",
      {},
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    this.address = response.data.email;
    return this.address;
  }

  async waitMails() {
    return new Promise((resolve) => {
      let time = 0;
      const itl = setInterval(async () => {
        const response = await this.client.get(`/${this.address}/messages`);
        if (response.data && response.data.length > 0) {
          resolve(
            response.data.map((item) => ({ ...item, content: item.body_html }))
          );
          clearInterval(itl);
          return;
        }
        if (time > 5) {
          resolve([]);
          clearInterval(itl);
          return;
        }
        time++;
      }, 5000);
    });
  }
}
