import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomBytes } from "crypto";

import { User } from "./users.schema";
import { Tenant } from "src/tenants/tenant.schema";
import { RoleMaster } from "src/roles/roles.schema";
import { EmailVerification } from "src/auth/email-verification.schema";

import { MailService } from "src/common/services/mail.service";
import { CreateUserDto } from "./users.controller";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(RoleMaster.name) private roleModel: Model<RoleMaster>,
    @InjectModel(EmailVerification.name)
    private verificationModel: Model<EmailVerification>,
    private readonly mailService: MailService
  ) {}

  async createUser(dto: CreateUserDto, logged: any) {
    try {
      console.log("Logged User Role:", logged.role);

      /** ------------------------------------------------------
       * 1. Check if username already exists
       * ------------------------------------------------------ */
      const userExists = await this.userModel.findOne({
        username: dto.username,
      });
      // if (!userExists) throw new ConflictException("User not exist..!");

      if (userExists) throw new ConflictException("User already exists");

      /** ------------------------------------------------------
       * 2. Validate role existence
       * ------------------------------------------------------ */
      const roleMaster = await this.roleModel.findOne({
        name: dto.role,
      });

      if (!roleMaster) throw new NotFoundException("Invalid role provided");

      /** ------------------------------------------------------
       * 3. Role permission validation
       * Only Admin or Super-admin can create Admin
       * ------------------------------------------------------ */
      if (
        dto.role === "admin" &&
        !["admin", "super-admin"].includes(logged.role)
      ) {
        throw new BadRequestException(
          "Only Super-Admin or Admin can create admin users"
        );
      }

      /** ------------------------------------------------------
       * 4. Super-admin creating an admin MUST select a tenant
       * ------------------------------------------------------ */
      if (
        logged.role === "super-admin" &&
        dto.role === "admin" &&
        !dto.product
      ) {
        throw new BadRequestException(
          "Please specify tenant for the admin user"
        );
      }

      /** ------------------------------------------------------
       * 5. Resolve tenant for super-admin OR assign logged tenant
       * ------------------------------------------------------ */
      let tenant;

      if (logged.role === "super-admin") {
        tenant = await this.tenantModel.findOne({
          productType: dto.product,
        });

        if (!tenant)
          throw new NotFoundException(
            "Tenant not found for the selected product"
          );
      }

      /** ------------------------------------------------------
       * 6. Generate password (replace with random if needed)
       * ------------------------------------------------------ */
      // const randomPassword = randomBytes(4).toString("hex").slice(0, 8);
      const randomPassword = "Admin123"; // for testing
      console.log("Generated Password:", randomPassword);

      /** ------------------------------------------------------
       * 7. Create the user
       * ------------------------------------------------------ */
      await this.userModel.create({
        ...dto,
        password: randomPassword,
        tenantId: logged.role === "super-admin" ? tenant._id : logged.tenant,
        roleMasterId: roleMaster._id,
        isVerified: true,
      });

      /** ------------------------------------------------------
       * 8. (Optional) Send password via email
       * ------------------------------------------------------ */
      // await this.mailService.sendPasswordEmail(dto.email, randomPassword);

      return { message: "User created successfully" };
    } catch (error) {
      console.error("Create User Error:", error?.message || error);

      // Re-throw known NestJS exception
      if (error instanceof HttpException) throw error;

      // Wrap unknown error
      throw new BadRequestException(error?.message || "User creation failed!");
    }
  }
}
