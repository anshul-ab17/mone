import argon2 from "argon2";

export class UserService {
  constructor(private repo: UserRepo) {}
  public async signup(email: string, password: string) {
    await this.ensureNotExists(email);
    const hashed = await this.hash(password);

    return this.repo.create(email, hashed);
  }

  public async signin(email: string, password: string) {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new Error("Invalid credentials");

    return user;
  }

  private async hash(password: string) {
    return argon2.hash(password);
  }

  private async ensureNotExists(email: string) {
    const exists = await this.repo.findByEmail(email);
    if (exists) throw new Error("User exists");
  }
}