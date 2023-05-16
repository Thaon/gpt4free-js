import es from "event-stream";
import { PassThrough } from "stream";
import * as crypto from "crypto";
import { v4 } from "uuid";

// type eventFunc = (eventName, data) => void;

export function toEventCB(arr, emit) {
  const pt = new PassThrough();
  pt.write(arr);
  pt.pipe(es.split(/\r?\n\r?\n/)) //split stream to break on newlines
    .pipe(
      es.map(async function (chunk, cb) {
        //turn this async function into a stream
        const [eventStr, dataStr] = chunk.split(/\r?\n/);
        const event = eventStr.replace(/event: /, "");
        const data = dataStr.replace(/data: /, "");
        emit(event, data);
        cb(null, { data, event });
      })
    );
}

export function toEventStream(arr) {
  const pt = new PassThrough();
  pt.write(arr);
  return pt;
}

export function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

export function randomStr() {
  return v4().split("-").join("").slice(-6);
}

export function parseJSON(str, defaultObj) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error(str, e);
    return defaultObj;
  }
}

export function encryptWithAes256Cbc(data, key) {
  const hash = crypto.createHash("sha256").update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", hash, iv);

  let encryptedData = cipher.update(data, "utf-8", "hex");
  encryptedData += cipher.final("hex");

  return iv.toString("hex") + encryptedData;
}
