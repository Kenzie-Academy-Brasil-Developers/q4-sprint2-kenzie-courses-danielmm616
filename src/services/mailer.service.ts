import transport from "../config/mailer.config";
import { ErrorHandler } from "../errors/errors";
import { Course, User } from "../entities";
import path from "path";
import handlebars, {
  NodemailerExpressHandlebarsOptions,
} from "nodemailer-express-handlebars";

class MailerService {
  welcomeEmail = (user: User, course: Course) => {
    const handlebarOptions: NodemailerExpressHandlebarsOptions = {
      viewEngine: {
        partialsDir: path.resolve("./src/views"),
        defaultLayout: false,
      },
      viewPath: path.resolve("./src/views"),
    };

    transport.use("compile", handlebars(handlebarOptions));

    const mailOption = {
      from: "daniel@kenzie.com.br",
      to: user.email,
      subject: "Welcome to Kenzie",
      template: "email",
      context: {
        firstName: user.firstName,
        courseName: course.courseName,
        courseDuration: course.duration,
      },
    };

    transport.sendMail(mailOption, (err) => {
      if (err) {
        throw new ErrorHandler(424, "Error sending email");
      }
    });
  };
}

export default new MailerService();
