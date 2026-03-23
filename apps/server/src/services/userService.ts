import argon2 from "argon2";
import { UserRepo } from "../repo/userRepo";

export class UserService {
  constructor(private repo: UserRepo) {}
  public async signup(email: string, password: string) {
    email = this.normalizeEmail(email);
    await this.ensureNotExists(email);
    const hashed = await this.hash(password);
    const user = await this.repo.create(email, hashed);
    return this.sanitizeUser(user);
  }

  public async signin(email: string, password: string) {
    email = this.normalizeEmail(email);
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("INVALID_CREDENTIALS");
    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new Error("INVALID_CREDENTIALS");
    return this.sanitizeUser(user);
  }


  private async hash(password: string) {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }
  private async ensureNotExists(email: string) {
    const exists = await this.repo.findByEmail(email);
    if (exists) throw new Error("USER_ALREADY_EXISTS");
  }
  private normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }
  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}