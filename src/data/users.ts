import bcrypt from "bcryptjs";

export interface User {
  id: number;
  username: string;
  fullName: string;
  passwordHash: string;
}

const DEMO_USERNAME = "Dmitry";
const DEMO_PASSWORD = "11111111";

const users: User[] = [
  {
    id: 1,
    username: DEMO_USERNAME,
    fullName: "Dmitry Demo",
    passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10),
  },
];

let nextId = users.length + 1;

export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username === username);
}

export function createUser(
  username: string,
  fullName: string,
  passwordHash: string
): User {
  const user: User = {
    id: nextId++,
    username,
    fullName,
    passwordHash,
  };
  users.push(user);
  return user;
}
