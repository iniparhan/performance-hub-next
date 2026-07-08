const users = [
  {
    id: 1,
    email: "admin@gmail.com",
    password: "123456",
    name: "Admin",
  },
];

export function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}
