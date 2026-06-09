import { group, sleep } from "k6";
import {
  createUser,
  deleteUser,
  getAuthMe,
  getUserById,
  listUsers,
  login,
  loginWithCredentials,
  randomUser,
  resolveOptions,
  smokeOptions,
  updateUserStatus
} from "./config.js";

export const options = resolveOptions(smokeOptions);

export default function () {
  group("users administration flow", () => {
    const admin = login();
    const adminToken = admin.token;

    listUsers(adminToken);

    const createdRequest = randomUser();
    const createdUser = createUser(adminToken, createdRequest);
    getUserById(adminToken, createdUser.id);

    const createdAuth = loginWithCredentials(createdRequest.cpf, createdRequest.password, "login created user by cpf");
    getAuthMe(createdAuth.token, {
      id: createdUser.id,
      cpf: createdRequest.cpf,
      email: createdRequest.email,
      role: createdRequest.role
    });

    updateUserStatus(adminToken, createdUser.id, false);
    getUserById(adminToken, createdUser.id);
    deleteUser(adminToken, createdUser.id);

    sleep(1);
  });
}
