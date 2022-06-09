import app from "../../app";
import { AppDataSource } from "../../data-source";
import { User } from "../../entities";
import { DataSource } from "typeorm";
import { generateToken, generateUser } from "..";
import supertest from "supertest";

describe("Get all users", () => {
  let connection: DataSource;

  let userAdm: User;
  let userNotAdm: User;

  beforeAll(async () => {
    await AppDataSource.initialize()
      .then((res) => (connection = res))
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });

    const date = new Date();
    const userRepo = connection.getRepository(User);
    userAdm = await userRepo.save({
      ...generateUser(),
      isAdm: true,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
    userNotAdm = await userRepo.save({
      ...generateUser(),
      isAdm: false,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("Return: Users as JSON response | Status code: 200", async () => {
    const token = generateToken(userAdm.id);

    const resUsers = await supertest(app)
      .get("/users")
      .set("Authorization", "Bearer " + token);

    const { password, ...user } = userAdm;

    expect(resUsers.status).toBe(200);
    expect(resUsers.body).toBeInstanceOf(Array);
    expect(resUsers.body[0]).toEqual(expect.objectContaining({ ...user }));
  });

  it("Return: Body error, missing token | Status code: 400", async () => {
    const response = await supertest(app).get("/users");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Missing authorization token.",
    });
  });

  it("Return: Body error, no permision | Status code: 401", async () => {
    const token = generateToken(userNotAdm.id);

    const resUsers = await supertest(app)
      .get("/users")
      .set("Authorization", "Bearer " + token);

    expect(resUsers.status).toBe(401);
    expect(resUsers.body).toHaveProperty("message");
    expect(resUsers.body).toStrictEqual({
      message: "You are not allowed to access this information",
    });
  });
});
