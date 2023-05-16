import { ChatModelFactory } from "./model/index.js";
import dotenv from "dotenv";

dotenv.config();

export const generate = async (model, prompt, options) => {
  const chatModel = new ChatModelFactory();

  if (!prompt) {
    return "please input prompt";
  }
  const chat = chatModel.get(model);
  if (!chat) {
    return "Unsupported  model";
  }
  const res = await chat.ask({ prompt, options });

  return res;
};
