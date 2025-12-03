import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  MenuCategory,
  MenuCategoryDocument,
} from "./schemas/menu-category.schema";
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from "./dto/create-menu-category.dto";

@Injectable()
export class MenuCategoriesService {
  constructor(
    @InjectModel(MenuCategory.name)
    private readonly menuCategoryModel: Model<MenuCategoryDocument>
  ) {}

  async create(
    tenantId: string,
    dto: CreateMenuCategoryDto
  ): Promise<MenuCategoryDocument> {
    try {
      const existing = await this.menuCategoryModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        name: dto.name,
      });

      if (existing) {
        throw new NotFoundException(
          `Menu category with name "${dto.name}" already exists`
        );
      }

      const created = new this.menuCategoryModel({
        ...dto,
        tenantId: new Types.ObjectId(tenantId),
      });
      return await created.save();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`${error?.message ?? error}`);
    }
  }

  async findAll(tenantId: string): Promise<MenuCategoryDocument[]> {
    try {
      return await this.menuCategoryModel
        .find({ tenantId: new Types.ObjectId(tenantId) })
        .sort({ name: 1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to retrieve menu categories"
      );
    }
  }

  async findOne(tenantId: string, id: string): Promise<MenuCategoryDocument> {
    try {
      const category = await this.menuCategoryModel
        .findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
        .exec();
      if (!category) {
        throw new NotFoundException("Menu category not found");
      }
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        "Failed to retrieve menu category"
      );
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMenuCategoryDto
  ): Promise<MenuCategoryDocument> {
    try {
      const existing = await this.menuCategoryModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        name: dto.name,
      });

      if (existing && existing._id.toString() !== id) {
        throw new NotFoundException(
          `Menu category with name "${dto.name}" already exists`
        );
      }

      const updated = await this.menuCategoryModel
        .findOneAndUpdate(
          { _id: id, tenantId: new Types.ObjectId(tenantId) },
          { $set: dto },
          { new: true }
        )
        .exec();

      if (!updated) {
        throw new NotFoundException("Menu category not found");
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`${error?.message ?? error}`);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const result = await this.menuCategoryModel
        .deleteOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException("Menu category not found");
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete menu category");
    }
  }
}
