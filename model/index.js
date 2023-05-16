import { You } from "./you/index.js";
import { AiDream } from "./aidream/index.js";
import { Phind } from "./phind/index.js";
import { Forefrontnew } from "./forefront/index.js";

// export enum Model {
//     // define new model here
//     You = 'you',
//     Forefront = 'forefront',
//     AiDream = 'aidream',
//     Phind = 'phind',
// }

export class ChatModelFactory {
  modelMap;
  options;

  constructor(options) {
    this.modelMap = new Map();
    this.options = options;
    this.init();
  }

  init() {
    // register new model here
    this.modelMap.set("you", new You(this.options));
    this.modelMap.set("forefront", new Forefrontnew(this.options));
    this.modelMap.set("aiDream", new AiDream(this.options));
    this.modelMap.set("phind", new Phind(this.options));
  }

  get(model) {
    return this.modelMap.get(model);
  }
}
