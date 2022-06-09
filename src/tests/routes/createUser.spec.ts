import app from "../../app";
import { AppDataSource } from "../../data-source";
import { User } from "../../entities";
import { DataSource } from "typeorm";
import { generateUser } from "..";
import supertest from "supertest";
import { validate } from "uuid";

describe("Create user", () => {
  let connection: DataSource;

  beforeAll(async () => {
    await AppDataSource.initialize()
      .then((res) => (connection = res))
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });
  });

  afterAll(async () => {
    await connection.destroy();
  });

  const user: Partial<User> = generateUser();
  it("Return: User as JSON response | Status code: 201", async () => {
    const response = await supertest(app)
      .post("/users")
      .send({ ...user });

    const { password, ...newUser } = user;

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(["courses"]);
    expect(response.body).toHaveProperty(["updatedAt"]);
    expect(response.body).toHaveProperty(["createdAt"]);
    expect(validate(response.body.id)).toBeTruthy();
    expect(response.body).toEqual(expect.objectContaining({ ...newUser }));
  });

  it("Return: Body error, missing password | Status code: 400", async () => {
    const { password, ...newUser } = user;

    const response = await supertest(app)
      .post("/users")
      .send({ ...newUser });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: ["password is a required field"],
    });
  });

  it("Return: Body error, user already exists | Status code: 409", async () => {
    const response = await supertest(app)
      .post("/users")
      .send({ ...user });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Email already exists",
    });
  });
});
