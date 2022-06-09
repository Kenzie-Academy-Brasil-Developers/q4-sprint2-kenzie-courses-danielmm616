import app from "../../app";
import { AppDataSource } from "../../data-source";
import { User } from "../../entities";
import { DataSource } from "typeorm";
import { generateToken, generateUser } from "..";
import supertest from "supertest";

describe("Get specific user", () => {
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
    const token = generateToken(userNotAdm.id);

    const response = await supertest(app)
      .get(`/users/${userNotAdm.id}`)
      .set("Authorization", "Bearer " + token);

    const { password, ...user } = userNotAdm;

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ...user }));
  });

  it("Return: Body error, missing token | Status code: 400", async () => {
    const response = await supertest(app).get(`/users/${userNotAdm.id}`);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Missing authorization token.",
    });
  });

  it("Return: Body error, no permision | Status code: 403", async () => {
    const token = generateToken(userNotAdm.id);

    const response = await supertest(app)
      .get(`/users/${userAdm.id}`)
      .set("Authorization", "Bearer " + token);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "You can't access information of another user",
    });
  });
});
