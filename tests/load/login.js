import { group } from "k6";
import { login, resolveOptions, smokeOptions } from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("auth login", () => {
    login();
  });
}
