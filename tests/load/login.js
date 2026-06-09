import { group } from "k6";
import { getAuthMe, login, resolveOptions, smokeOptions } from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("auth login", () => {
    const auth = login();
    getAuthMe(auth.token, {
      id: auth.user && auth.user.id,
      cpf: auth.user && auth.user.cpf,
      email: auth.user && auth.user.email,
      role: auth.user && auth.user.role
    });
  });
}
