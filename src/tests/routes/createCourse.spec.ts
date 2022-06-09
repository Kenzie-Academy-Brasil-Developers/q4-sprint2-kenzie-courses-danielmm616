import supertest from "supertest";
import { DataSource } from "typeorm";
import { validate } from "uuid";
import { generateCourse, generateToken, generateUser } from "..";
import app from "../../app";
import { AppDataSource } from "../../data-source";
import { Course, User } from "../../entities";

describe("Create course", () => {
  let connection: DataSource;
  let course: Partial<Course> = generateCourse();

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

  it("Return: Course as JSON response | Status code: 201", async () => {
    const token = generateToken(userAdm.id);

    const response = await supertest(app)
      .post("/courses")
      .set("Authorization", "Bearer " + token)
      .send({ ...course });

    expect(response.status).toBe(201);
    expect(validate(response.body.id)).toBeTruthy();
    expect(response.body).toEqual(expect.objectContaining({ ...course }));
  });
});
