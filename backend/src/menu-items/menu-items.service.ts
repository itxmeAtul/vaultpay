import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MenuItem, MenuItemDocument } from "./schemas/menu-item.schema";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";

type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: { total: number; page: number; limit: number };
};

@Injectable()
export class MenuItemsService {
  private readonly logger = new Logger(MenuItemsService.name);

  constructor(
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>
  ) {}

  async create(
    tenantId: string,
    dto: CreateMenuItemDto
  ): Promise<ServiceResponse<MenuItem>> {
    let created: MenuItemDocument | null = null;
    try {
      // basic validation
      if (!dto || typeof dto !== "object") {
        throw new BadRequestException("Invalid create payload");
      }

      if (!dto["name"] || typeof dto["name"] !== "string") {
        throw new BadRequestException("Menu item name is required");
      }

      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException("Invalid tenantId");
      }

      const tenantObjId = new Types.ObjectId(tenantId);

      // avoid duplicate by name per tenant
      const exists = await this.menuItemModel.findOne({
        name: dto["name"],
        tenantId: tenantObjId,
      });
      if (exists) {
        throw new ConflictException("Menu item with this name already exists");
      }

      created = new this.menuItemModel({
        ...dto,
        tenantId: tenantObjId,
      });

      const saved = await created.save();
      return { success: true, data: saved };
    } catch (err) {
      // rethrow known exceptions, wrap others
      if (
        err instanceof BadRequestException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      this.logger.error("Create menu item failed", err);
      throw new InternalServerErrorException("Failed to create menu item");
    } finally {
      this.logger.debug("create() finished");
      // no resources to explicitly free
    }
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<ServiceResponse<MenuItem[]>> {
    try {
      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException("Invalid tenantId");
      }

      page = Math.max(1, Math.floor(Number(page) || 1));
      limit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 10)));

      const tenantObjId = new Types.ObjectId(tenantId);
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.menuItemModel
          .find({ tenantId: tenantObjId })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.menuItemModel.countDocuments({ tenantId: tenantObjId }).exec(),
      ]);

      return {
        success: true,
        data: items,
        meta: { total, page, limit },
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error("findAll failed", err);
      throw new InternalServerErrorException("Failed to fetch menu items");
    } finally {
      this.logger.debug("findAll() finished");
    }
  }

  async findOne(
    tenantId: string,
    id: string
  ): Promise<ServiceResponse<MenuItem>> {
    try {
      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException("Invalid tenantId");
      }
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException("Invalid id");
      }

      const doc = await this.menuItemModel
        .findOne({
          _id: new Types.ObjectId(id),
          tenantId: new Types.ObjectId(tenantId),
        })
        .exec();

      if (!doc) {
        throw new NotFoundException("Menu item not found");
      }

      return { success: true, data: doc };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error("findOne failed", err);
      throw new InternalServerErrorException("Failed to fetch menu item");
    } finally {
      this.logger.debug("findOne() finished");
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMenuItemDto
  ): Promise<ServiceResponse<MenuItem>> {
    try {
      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException("Invalid tenantId");
      }
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException("Invalid id");
      }
      if (!dto || typeof dto !== "object") {
        throw new BadRequestException("Invalid update payload");
      }

      const tenantObjId = new Types.ObjectId(tenantId);
      const objId = new Types.ObjectId(id);

      // if updating name, ensure no duplicate with other docs
      if (dto["name"]) {
        const dup = await this.menuItemModel.findOne({
          name: dto["name"],
          tenantId: tenantObjId,
          _id: { $ne: objId },
        });
        if (dup) {
          throw new ConflictException(
            "Another menu item with this name exists"
          );
        }
      }

      const doc = await this.menuItemModel
        .findOneAndUpdate(
          { _id: objId, tenantId: tenantObjId },
          { $set: dto },
          { new: true }
        )
        .exec();

      if (!doc) {
        throw new NotFoundException("Menu item not found");
      }

      return { success: true, data: doc };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      this.logger.error("update failed", err);
      throw new InternalServerErrorException("Failed to update menu item");
    } finally {
      this.logger.debug("update() finished");
    }
  }

  async remove(tenantId: string, id: string): Promise<ServiceResponse<null>> {
    try {
      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException("Invalid tenantId");
      }
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException("Invalid id");
      }

      const res = await this.menuItemModel
        .deleteOne({
          _id: new Types.ObjectId(id),
          tenantId: new Types.ObjectId(tenantId),
        })
        .exec();

      if (res.deletedCount === 0) {
        throw new NotFoundException("Menu item not found");
      }

      return { success: true, data: null, message: "Deleted" };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error("remove failed", err);
      throw new InternalServerErrorException("Failed to remove menu item");
    } finally {
      this.logger.debug("remove() finished");
    }
  }
}
