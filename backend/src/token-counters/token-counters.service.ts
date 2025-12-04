import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  TokenCounter,
  TokenCounterDocument,
} from "./schemas/token-counter.schema";
import { CreateTokenCounterDto } from "./dto/create-token-counter.dto";
import { UpdateTokenCounterDto } from "./dto/update-token-counter.dto";

@Injectable()
export class TokenCountersService {
  constructor(
    @InjectModel(TokenCounter.name)
    private readonly tokenCounterModel: Model<TokenCounterDocument>
  ) {}

  async create(
    tenantId: string,
    dto: CreateTokenCounterDto
  ): Promise<TokenCounterDocument> {
    try {
      const existing = await this.tokenCounterModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        counterName: dto.counterName,
      });

      if (existing) {
        throw new NotFoundException(
          `Token counter with name "${dto.counterName}"  already exists`
        );
      }

      const created = new this.tokenCounterModel({
        ...dto,
        tenantId: new Types.ObjectId(tenantId),
      });
      return await created.save();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to create token counter for tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }

  async findAll(tenantId: string): Promise<TokenCounterDocument[]> {
    try {
      return await this.tokenCounterModel
        .find({ tenantId: new Types.ObjectId(tenantId) })
        .sort({ counterName: 1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to list token counters for tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }

  async findOne(tenantId: string, id: string): Promise<TokenCounterDocument> {
    try {
      const doc = await this.tokenCounterModel
        .findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
        .exec();

      if (!doc) {
        throw new NotFoundException(
          `Token counter with id "${id}" for tenant "${tenantId}" not found`
        );
      }
      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to retrieve token counter "${id}" for tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTokenCounterDto
  ): Promise<TokenCounterDocument> {
    try {
      const doc = await this.tokenCounterModel
        .findOneAndUpdate(
          { _id: id, tenantId: new Types.ObjectId(tenantId) },
          { $set: dto },
          { new: true }
        )
        .exec();

      if (!doc) {
        throw new NotFoundException(
          `Token counter with id "${id}" for tenant "${tenantId}" not found`
        );
      }
      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to update token counter "${id}" for tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const res = await this.tokenCounterModel
        .deleteOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
        .exec();

      if (res.deletedCount === 0) {
        throw new NotFoundException(
          `Token counter with id "${id}" for tenant "${tenantId}" not found`
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to remove token counter "${id}" for tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }

  // Bonus: Get next token number
  async getNextToken(tenantId: string, counterId: string): Promise<number> {
    try {
      const counter = await this.findOne(tenantId, counterId);
      const nextToken = counter.lastToken + 1;

      await this.tokenCounterModel
        .findByIdAndUpdate(counter._id, { lastToken: nextToken })
        .exec();

      return nextToken;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to get next token for counter "${counterId}" and tenant "${tenantId}": ${error?.message ?? error}`
      );
    } finally {
      // cleanup if needed
    }
  }
}
