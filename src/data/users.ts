export interface User {
  id: number;
  username: string;
  fullName: string;
  passwordHash: string;
}

const users: User[] = [];
let nextId = 1;

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
