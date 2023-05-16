import { generate } from "./index.js";
import XRegExp from "xregexp";

const generateUnityClass = async (prompt) => {
  if (!prompt) {
    return "please input prompt";
  }
  const res = await generate("you", prompt);
  // console.log(res.text);
  let toSearch = res.text;
  // match the outermost parentheses to identify the JSON
  let match = XRegExp.matchRecursive(toSearch, "{", "}", "g");
  // add { and } to the match
  match = match.map((m) => "{" + m + "}");
  if (!match) {
    return "No JSON found";
  }
  console.log("MATCHED", match, "\n\n\n");
  // get the data
  const parsed = JSON.parse(match);
  console.log(parsed.classname + "\n\n\n");
  console.log(parsed.code);

  return res;
};

generateUnityClass(
  `You are an AI that emulates a REST API for a programming bot that creates usable Unity Code.
  The code must be able to be copied and pasted into a new C# script in Unity and run without errors.
  You will be given a prompt and you must respond with a JSON that includes the class name and the code.
  This is your assignment:
  'Write a small Unity component to control a gyro camera from a phonne's accelerometer'.

  Only respond with a JSON that has the following schema:
{
  classname: [the name of the C# class],
  code: [the actual code you are writing]
}

Always stick to the specific as this JSON needs to be parsed and no additional text must be outside of it.
`
);
