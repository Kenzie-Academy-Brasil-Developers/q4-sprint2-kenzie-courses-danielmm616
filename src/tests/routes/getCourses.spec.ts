import supertest from "supertest";
import { DataSource } from "typeorm";
import { generateCourse, generateToken, generateUser } from "..";
import app from "../../app";
import { AppDataSource } from "../../data-source";
import { Course, User } from "../../entities";

describe("Get courses", () => {
  let connection: DataSource;

  let userAdm: User;
  let userNotAdm: User;
  let newCourse: Course;

  beforeEach(async () => {
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

  afterEach(async () => {
    await connection.destroy();
  });

  it("Return: Courses as JSON response | Status code: 200", async () => {
    const token = generateToken(userAdm.id);

    const response = await supertest(app)
      .get("/courses")
      .set("Authorization", "Bearer " + token);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toEqual(expect.objectContaining({ ...newCourse }));
  });
});
