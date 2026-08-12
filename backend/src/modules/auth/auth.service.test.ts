import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = await import("../../prisma/prisma.js");
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;
const { generateToken } = await import("../../shared/utils/jwt.js");
const { registerUser, loginHandler } = await import("./auth.service.js");

vi.mock("../../prisma/prisma.js", () => ({
  prisma: {
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

vi.mock("../../shared/utils/jwt.js", () => ({
  generateToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
});

describe("registerUser", () => {
  it("хешує пароль перед збереженням і повертає токен + користувача без password", async () => {
    (bcrypt.hash as any).mockResolvedValue("hashed-pw");
    (prisma.user.create as any).mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      password: "hashed-pw",
    });
    (generateToken as any).mockReturnValue("jwt-token");

    const result = await registerUser("a@b.com", "plain-password");

    expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", password: "hashed-pw" },
    });
    expect(generateToken).toHaveBeenCalledWith({ userId: "user-1" });
    expect(result).toEqual({
      token: "jwt-token",
      user: { id: "user-1", email: "a@b.com" },
    });
    // пароль (навіть хешований) не повинен потрапляти у відповідь
    expect(result.user).not.toHaveProperty("password");
  });
});

describe("loginHandler", () => {
  it('кидає 401 "Invalid credentials", якщо користувача з таким email не існує', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(loginHandler("nobody@b.com", "pw")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid credentials",
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("кидає 401, якщо пароль не збігається (не витікає, чи існує email)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      password: "hashed-pw",
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    await expect(loginHandler("a@b.com", "wrong-pw")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid credentials",
    });
  });

  it("повертає токен і користувача без password при коректних кредах", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      password: "hashed-pw",
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    (jwt.sign as any).mockReturnValue("jwt-token");

    const result = await loginHandler("a@b.com", "correct-pw");

    expect(bcrypt.compare).toHaveBeenCalledWith("correct-pw", "hashed-pw");
    expect(jwt.sign).toHaveBeenCalledWith({ userId: "user-1" }, "test-secret", { expiresIn: "7d" });
    expect(result).toEqual({
      token: "jwt-token",
      user: { id: "user-1", email: "a@b.com" },
    });
  });
});
