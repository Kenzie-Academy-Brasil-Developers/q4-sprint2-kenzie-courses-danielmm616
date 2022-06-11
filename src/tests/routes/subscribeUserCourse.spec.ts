import supertest from "supertest";
import app from "../../app";
import { AppDataSource } from "../../data-source";
import { Course, User } from "../../entities";
import { DataSource } from "typeorm";
import { generateCourse, generateToken, generateUser } from "..";

describe("Subscribe user", () => {
  let connection: DataSource;
  let user: User;
  let course: Course;

  beforeAll(async () => {
    await AppDataSource.initialize()
      .then((res) => (connection = res))
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });

    const date = new Date();
    const userRepo = connection.getRepository(User);
    user = await userRepo.save({
      ...generateUser(),
      isAdm: false,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
    const courseRepo = connection.getRepository(Course);
    course = await courseRepo.save({
      ...generateCourse(),
    });
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("Return: message: Missing authorization token. | Status code: 400", async () => {
    const response = await supertest(app)
      .post(`/courses/${course.id}/users`)
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Missing authorization token.",
    });
  });

  it("Return: message: invalid token | Status code: 401", async () => {
    const token = generateToken(user.id);

    const response = await supertest(app)
      .post(`/courses/${course.id}/users`)
      .send()
      .set("Authorization", `Bearer dvav${token}czxcz`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "invalid token",
    });
  });

  it("Return: message: Email de inscrição enviado com sucesso | Status code: 200", async () => {
    const token = generateToken(user.id);

    const response = await supertest(app)
      .post(`/courses/${course.id}/users`)
      .send()
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "Email de inscrição enviado com sucesso",
    });
  });

  it("Return: message: jwt malformed | Status code: 401", async () => {
    const response = await supertest(app)
      .post(`/courses/${course.id}/users`)
      .send()
      .set("Authorization", "Bearer mvaklsmlkvas");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toStrictEqual({
      message: "jwt malformed",
    });
  });
});
