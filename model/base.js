import { Stream } from "stream";

// export interface ChatOptions {
// }

// export interface Response {
//     text: string | null;
//     other?: any;
// }

// export interface ResponseStream {
//     text: Stream;
//     other?: any;
// }

// export interface Request {
//     prompt: string;
//     options?: any;
// }

export class Chat {
  options;

  constructor(options) {
    this.options = options;
  }

  ask(req) {}

  askStream(req) {}
}
