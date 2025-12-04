import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
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

      if (logged.role !== "super-admin") {
        tenant = await this.tenantModel.findOne({
          _id: logged.tenant,
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
        tenantId: tenant._id,
        roleMasterId: roleMaster._id,
        isVerified: true,
        createdBy: logged.userId,
      });

      /** ------------------------------------------------------
       * 8. (Optional) Send password via email
       * ------------------------------------------------------ */
      // await this.mailService.sendPasswordEmail(
      //   dto.email,
      //   dto.username,
      //   randomPassword
      // );

      return { message: "User created successfully" };
    } catch (error) {
      console.error("Create User Error:", error?.message || error);

      // Re-throw known NestJS exception
      if (error instanceof HttpException) throw error;

      // Wrap unknown error
      throw new BadRequestException(error?.message || "User creation failed!");
    }
  }

  async getAll(
    logged: any,
    tenant: string,
    options: { page: number; limit: number; search?: string }
  ) {
    try {
      // Validate pagination inputs
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Number(options.limit) || 10);
      const search = (options.search || "").trim();

      // Only super-admin can query arbitrary tenant; others are limited to their own tenant
      let tenantIdToQuery = tenant;
      if (logged.role !== "super-admin") {
        // enforce tenant scoping for non-super-admin
        tenantIdToQuery = logged.tenant;
      } else {
        // If super-admin asked for a tenant, ensure tenant exists
        if (!tenantIdToQuery) {
          throw new BadRequestException(
            "Tenant must be specified by super-admin"
          );
        }
        const tenantExists = await this.tenantModel
          .findById(tenantIdToQuery)
          .select("_id");
        if (!tenantExists)
          throw new NotFoundException("Specified tenant not found");
      }

      // Build search filter
      const filter: any = {
        tenantId: Types.ObjectId.createFromHexString(tenantIdToQuery),
      };

      if (search) {
        // escape user input for safe regex
        const escapeRegex = (s: string) =>
          s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ username: re }, { email: re }, { phone: re }];
      }

      // Count total matching documents
      const total = await this.userModel.countDocuments(filter);

      // Fetch paginated results with related role and tenant info
      const users = await this.userModel
        .find(filter)
        .populate("roleMasterId", "name")
        .populate("tenantId", "productType name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      let usersWithDetails = users.map((user) => {
        let roleName = "N/A";
        let tenantName = "N/A";
        if (user.tenantId && typeof user.tenantId === "object") {
          tenantName = (user.tenantId as any).name || "N/A";
        }
        if (user.roleMasterId && typeof user.roleMasterId === "object") {
          roleName = (user.roleMasterId as any).name || "N/A";
        }
        return {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          mobileNo: user.mobileNo,
          role: roleName,
          tenant: tenantName,
          isVerified: user.isVerified,
        };
      });

      return {
        data: usersWithDetails,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      // Re-throw known NestJS exceptions as-is
      if (error instanceof HttpException) throw error;

      // Wrap unknown errors with a friendly message
      throw new BadRequestException(error?.message || "Failed to fetch users");
    }
  }

  async deleteMany(ids?: string[]) {
    try {
      const excludedRoles = ["admin", "super-admin"];

      // sanitize ids list
      const idList = Array.isArray(ids)
        ? Array.from(
            new Set(ids.filter((i) => typeof i === "string" && i.trim()))
          )
        : [];

      // build base filter to exclude admin/super-admin
      const baseFilter: any = { role: { $nin: excludedRoles } };

      // if ids provided, restrict to those ids as well
      const filter = idList.length
        ? { ...baseFilter, _id: { $in: idList } }
        : baseFilter;

      // ensure there are deletable users matching the filter
      const matchCount = await this.userModel.countDocuments(filter);
      if (matchCount === 0) {
        if (idList.length) {
          throw new NotFoundException(
            "No deletable users found for the provided IDs"
          );
        } else {
          throw new NotFoundException("No users found to delete");
        }
      }

      const result = await this.userModel.deleteMany(filter);

      return {
        message: `${result.deletedCount || 0} user(s) deleted successfully`,
      };
    } catch (error) {
      console.error("Delete Users Error:", error?.message || error);

      if (error instanceof HttpException) throw error;

      throw new BadRequestException(error?.message || "Failed to delete users");
    }
  }
}
