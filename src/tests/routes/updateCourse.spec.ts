import supertest from "supertest";
import { DataSource } from "typeorm";
import { generateCourse, generateToken, generateUser } from "..";
import app from "../../app";
import { AppDataSource } from "../../data-source";
import { Course, User } from "../../entities";

describe("Update Course", () => {
  let connection: DataSource;

  let userAdm: User;
  let userNotAdm: User;
  let newCourse: Course;

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
    const courseRepo = connection.getRepository(Course);
    newCourse = await courseRepo.save({
      ...generateCourse(),
    });
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("Return: Course as JSON response | Status code: 200", async () => {
    const token = generateToken(userAdm.id);

    const newInformation = generateCourse();

    const response = await supertest(app)
      .patch(`/courses/${newCourse.id}`)
      .set("Authorization", "Bearer " + token)
      .send({ ...newInformation });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ ...newInformation })
    );
  });

  it("Return: Body error, missing token | Status code: 400", async () => {
    const newInformation = generateCourse();

    const response = await supertest(app)
      .patch(`/courses/${newCourse.id}`)
      .send({ ...newInformation });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Missing authorization token.",
    });
  });
});
