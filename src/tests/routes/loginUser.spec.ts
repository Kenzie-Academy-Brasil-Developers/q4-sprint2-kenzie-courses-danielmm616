import app from "../../app";
import { AppDataSource } from "../../data-source";
import { User } from "../../entities";
import { DataSource } from "typeorm";
import { generateUser } from "..";
import supertest from "supertest";
import { verify } from "jsonwebtoken";

describe("Login user", () => {
  let connection: DataSource;

  const user: Partial<User> = generateUser();

  beforeAll(async () => {
    await AppDataSource.initialize()
      .then((res) => (connection = res))
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });

    await supertest(app)
      .post("/users")
      .send({ ...user });
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("Return: token as JSON response | Status code: 200", async () => {
    const { email, password } = user;

    const response = await supertest(app)
      .post("/login")
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(verify(response.body.token, process.env.SECRET_KEY)).toBeTruthy();
  });

  it("Return: Body error, invalid credentials | Status code: 401", async () => {
    const { email } = user;

    const response = await supertest(app)
      .post("/login")
      .send({ email, password: "wrongPassword" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Invalid credentials",
    });
  });
});
