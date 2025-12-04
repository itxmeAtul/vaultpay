// src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderItemStatus,
  OrderStatus,
  // optional explicit item types if you export them from schema
  RestaurantOrderItem,
} from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from './dto/update-order-item-status.dto';
import { RemakeOrderItemDto } from './dto/remake-order-item.dto';
import { TokenCounter } from 'src/token-counters/schemas/token-counter.schema';
import { BusinessType } from 'src/tenants/tenant.schema';

/**
 * Helper: safely read the status from an order item.
 * Some item sub-docs (restaurant/service) contain `status`. Others (retail, ecommerce)
 * may not. This helper returns the detected status or a sensible default.
 */
function getItemStatus(item: any): OrderItemStatus {
  const s = (item as any).status;
  if (
    typeof s === 'string' &&
    Object.values(OrderItemStatus).includes(s as OrderItemStatus)
  ) {
    return s as OrderItemStatus;
  }
  // default fallback - treat items without explicit status as PENDING
  return OrderItemStatus.PENDING;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    // used for atomic token increments; required if you want counter-based tokens
    @InjectModel(TokenCounter.name)
    private readonly counterModel: Model<TokenCounter>,
  ) {}

  private buildItemsForBusinessType(businessType: string, rawItems: any[]) {
    switch (businessType) {
      case BusinessType.RESTAURANT:
        return rawItems.map((i) => {
          const qty = Number(i.qty ?? 1);
          const price = Number(i.price ?? 0);
          const total = Number(i.total ?? price * qty);
          return {
            _id: new Types.ObjectId(),
            type: BusinessType.RESTAURANT,
            menuItemId: Types.ObjectId.createFromHexString(i.menuItemId),
            qty,
            price,
            variant: i.variant ?? null,
            total,
            status: OrderItemStatus.PENDING,
            preparedQty: 0,
            parentItemId: i.parentItemId
              ? Types.ObjectId.createFromHexString(i.parentItemId)
              : undefined,
          };
        });

      case BusinessType.RETAIL:
        return rawItems.map((i) => {
          const qty = Number(i.qty ?? 1);
          const unitPrice = Number(i.unitPrice ?? i.price ?? 0);
          const total = Number(i.total ?? unitPrice * qty);
          return {
            _id: new Types.ObjectId(),
            type: BusinessType.RETAIL,
            productId: Types.ObjectId.createFromHexString(i.productId),
            sku: i.sku ?? undefined,
            qty,
            unitPrice,
            total,
            warehouseId: i.warehouseId
              ? Types.ObjectId.createFromHexString(i.warehouseId)
              : undefined,
            expectedDeliveryDate: i.expectedDeliveryDate
              ? new Date(i.expectedDeliveryDate)
              : undefined,
          };
        });

      case BusinessType.SERVICE:
        return rawItems.map((i) => {
          const price = Number(i.price ?? 0);
          const total = Number(i.total ?? price);
          return {
            _id: new Types.ObjectId(),
            type: BusinessType.SERVICE,
            serviceId: Types.ObjectId.createFromHexString(i.serviceId),
            serviceName: i.serviceName,
            durationMinutes: Number(i.durationMinutes ?? 0),
            price,
            total,
            assignedProviderId: i.assignedProviderId
              ? Types.ObjectId.createFromHexString(i.assignedProviderId)
              : undefined,
            scheduledTime: i.scheduledTime
              ? new Date(i.scheduledTime)
              : undefined,
            status: i.status ?? 'pending',
          };
        });

      case BusinessType.ECOMMERCE:
        return rawItems.map((i) => {
          const qty = Number(i.qty ?? 1);
          const price = Number(i.price ?? 0);
          const total = Number(i.total ?? price * qty);
          return {
            _id: new Types.ObjectId(),
            type: BusinessType.ECOMMERCE,
            productId: Types.ObjectId.createFromHexString(i.productId),
            variantId: i.variantId
              ? Types.ObjectId.createFromHexString(i.variantId)
              : undefined,
            qty,
            price,
            total,
            shippingMethod: i.shippingMethod ?? undefined,
            trackingNumber: i.trackingNumber ?? undefined,
          };
        });

      default:
        throw new BadRequestException(
          `Unsupported businessType: ${businessType}`,
        );
    }
  }

  private updateItemState(item: any, dto: UpdateOrderItemStatusDto) {
    const current = item.status;
    const next = dto.status;

    const qty = item.qty;
    const prepared = dto.preparedQty ?? item.preparedQty;

    // --- VALIDATION ---
    const INVALID = [
      [OrderItemStatus.DELIVERED, OrderItemStatus.IN_PROGRESS],
      [OrderItemStatus.CANCELLED, OrderItemStatus.IN_PROGRESS],
      [OrderItemStatus.REJECTED, OrderItemStatus.IN_PROGRESS],
      [OrderItemStatus.COOKED, OrderItemStatus.PENDING],
    ];
    if (INVALID.some(([a, b]) => a === current && b === next)) {
      throw new BadRequestException(
        `Cannot change item from ${current} to ${next}`,
      );
    }

    // --- PARTIAL COOK LOGIC ---
    if (next === OrderItemStatus.IN_PROGRESS) {
      item.status = OrderItemStatus.IN_PROGRESS;
      return;
    }

    if (next === OrderItemStatus.PARTIAL_COOKED) {
      if (prepared <= 0 || prepared >= qty)
        throw new BadRequestException(
          'Partial cooked requires 0 < prepared < qty',
        );

      item.status = OrderItemStatus.PARTIAL_COOKED;
      item.preparedQty = prepared;
      return;
    }

    // FULL COOK
    if (next === OrderItemStatus.COOKED) {
      item.status = OrderItemStatus.COOKED;
      item.preparedQty = qty;
      return;
    }

    // DELIVERED
    if (next === OrderItemStatus.DELIVERED) {
      item.status = OrderItemStatus.DELIVERED;
      item.preparedQty = qty;
      return;
    }

    // CANCEL / REJECT
    if ([OrderItemStatus.CANCELLED, OrderItemStatus.REJECTED].includes(next)) {
      item.status = next;
      return;
    }

    throw new BadRequestException(`Unhandled item status transition: ${next}`);
  }

  /**
   * Recalculate order.status based on item statuses.
   * Uses enums to avoid string mismatch.
   */
  private recalcOrderStatus(order: OrderDocument): void {
    const items = order.items || [];

    if (items.length === 0) {
      order.status = OrderStatus.CANCELLED;
      return;
    }

    // map to status strings we expect on items (safely)
    const statuses = items.map((i) => getItemStatus(i));

    // all canceled or rejected => order cancelled
    const allCancelledOrRejected = statuses.every((s) =>
      [OrderItemStatus.CANCELLED, OrderItemStatus.REJECTED].includes(s),
    );
    if (allCancelledOrRejected) {
      order.status = OrderStatus.CANCELLED;
      return;
    }

    // check if any item has partial preparation (preparedQty < qty)
    const hasPartialPrep = items.some((item: any) => {
      const qty = Number(item.qty ?? 1);
      const preparedQty = Number(item.preparedQty ?? 0);
      return preparedQty > 0 && preparedQty < qty;
    });

    const allDelivered = statuses.every((s) => s === OrderItemStatus.DELIVERED);
    if (allDelivered) {
      order.status = OrderStatus.DELIVERED;
      return;
    }
    const anyPartial = statuses.includes(OrderItemStatus.PARTIAL_COOKED);
    const anyInProgress = statuses.includes(OrderItemStatus.IN_PROGRESS);
    const anyCooked = statuses.includes(OrderItemStatus.COOKED);

    if (anyPartial || anyInProgress) {
      order.status = OrderStatus.PARTIAL_PENDING;
      return;
    }

    if (anyCooked && !anyInProgress) {
      order.status = OrderStatus.READY;
      return;
    }

    order.status = OrderStatus.PENDING;
  }

  /**
   * Create an order.
   *
   * Flow:
   *  - if counterId provided: atomically increment counter.lastToken using $inc and use returned token
   *  - compute per-item totals (price * qty) if not provided
   *  - compute grandTotal
   *  - write order inside transaction (so both counter increment and order create are atomic)
   */
  async create(tenantId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const session = await this.orderModel.db.startSession();
    try {
      let createdOrder: OrderDocument | null = null;

      await session.withTransaction(async () => {
        // atomically increment counter if provided
        let tokenNumber = dto.tokenNumber ?? null;
        if (dto.counterId) {
          const counter = await this.counterModel.findOneAndUpdate(
            { _id: dto.counterId, tenantId: new Types.ObjectId(tenantId) },
            { $inc: { lastToken: 1 } },
            { new: true, session },
          );

          if (!counter) {
            throw new NotFoundException('Counter not found for tenant');
          }
          tokenNumber = counter.lastToken;
        }

        // prepare items - normalize types and compute totals
        // const items = dto.items.map((i) => {
        //   // For restaurant-type orders we expect menuItemId; for other business types the DTO should
        //   // contain appropriate fields. This implementation currently assumes restaurant-style items.
        //   if (!i.menuItemId) {
        //     throw new BadRequestException(
        //       "menuItemId is required for restaurant item"
        //     );
        //   }
        //   const qty = Number(i.qty ?? 1);
        //   const price = Number(i.price ?? 0);

        //   if (qty <= 0) throw new BadRequestException("Item qty must be > 0");
        //   if (price < 0)
        //     throw new BadRequestException("Item price cannot be negative");

        //   const total = Number(i.total ?? price * qty);

        //   return {
        //     _id: new Types.ObjectId(),
        //     menuItemId: new Types.ObjectId(i.menuItemId),
        //     qty,
        //     price,
        //     variant: i.variant ?? null,
        //     total,
        //     status: OrderItemStatus.PENDING,
        //     preparedQty: 0,
        //     parentItemId: i.parentItemId
        //       ? new Types.ObjectId(i.parentItemId)
        //       : undefined,
        //   } as Partial<RestaurantOrderItem>; // typed as restaurant item
        // });

        const items = this.buildItemsForBusinessType(
          dto.businessType,
          dto.items,
        );

        const grandTotal = items.reduce(
          (sum, it) => sum + Number((it as any).total || 0),
          0,
        );

        const doc = new this.orderModel({
          tenantId: new Types.ObjectId(tenantId),
          counterId: dto.counterId
            ? new Types.ObjectId(dto.counterId)
            : undefined,
          tokenNumber,
          businessType: dto.businessType,
          orderNumber: dto.orderNumber ?? `ORD-${Date.now()}`,
          status: OrderStatus.PENDING,
          items,
          paymentMode: dto.paymentMode ?? 'cod',
          isPaid: Boolean(dto.isPaid ?? false),
          grandTotal,
          metadata: dto.metadata ?? {},
        });

        // save within session
        createdOrder = (await doc.save({ session })) as OrderDocument;
      });

      if (createdOrder == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (createdOrder as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      // session committed successfully
      // return populated order

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      console.log(err, 'err');
      // errors thrown in transaction will cause rollback
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      // wrap other errors
      throw new InternalServerErrorException(
        err.message || 'Failed to create order',
      );
    } finally {
      await session.endSession();
    }
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.orderModel
          .find({ tenantId: new Types.ObjectId(tenantId) })
          .populate('items.menuItemId')
          .populate('counterId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.orderModel.countDocuments({
          tenantId: new Types.ObjectId(tenantId),
        }),
      ]);

      // Transform response to match desired format
      const transformedOrders = orders.map((order: any) => ({
        ...order.toObject(),
        counterId: order.counterId?._id || order.counterId,
        counterName: order.counterId?.counterName || '',
        items: (order.items || []).map((item: any) => {
          const menuItem = item.menuItemId as any;
          return {
            _id: item._id,
            menuItemId: menuItem?._id || item.menuItemId,
            name: menuItem?.name || '',
            variant: item.variant,
            qty: item.qty,
            unitPrice: item.price,
            total: item.total,
            status: item.status,
            preparedQty: item.preparedQty,
          };
        }),
      }));

      return {
        data: transformedOrders,
        total,
        page,
        limit,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        err?.message ?? 'Failed to fetch orders',
      );
    }
  }

  async findOne(tenantId: string, id: string): Promise<OrderDocument> {
    try {
      // validate id early
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid order id');
      }

      // Populate any possible refs used by different business types.
      // Add more paths here if your schemas include additional refs.
      const order = await this.orderModel
        .findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
        .populate('items.menuItemId') // restaurant menu item
        .populate('items.productId') // retail/ecommerce product
        .populate('items.variantId') // ecommerce variant
        .populate('items.serviceId') // service entry
        .populate('items.assignedProviderId') // service provider
        .populate('items.warehouseId') // retail warehouse
        .populate('counterId') // token counter
        .exec();

      if (!order) {
        throw new NotFoundException(
          'Order not found for the given tenant and id',
        );
      }

      // Normalize / enrich item-level fields so callers always get sensible numbers and metadata
      // (non-destructive for stored document but helpful for API consumers)
      order.items = (order.items || []).map((it: any) => {
        const item = it as any;

        // normalize quantities and prices
        item.qty = Number(item.qty ?? item.quantity ?? 0);
        // support both price/unitPrice fields across business types
        item.price = Number(item.price ?? item.unitPrice ?? 0);
        // ensure total is numeric and falls back to price * qty
        item.total = Number(item.total ?? item.price * item.qty);

        // normalize status using helper so missing statuses become PENDING
        item.status = getItemStatus(item);

        // expose metadata if present (menu variant, custom metadata, etc.)
        item._meta = item._meta ?? item.metadata ?? {};

        return item;
      }) as any;

      // ensure order-level metadata exists
      (order as any).metadata = (order as any).metadata ?? {};

      return order;
    } catch (err) {
      // rethrow known HTTP exceptions
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      // wrap unexpected errors with a clear message
      throw new InternalServerErrorException(
        err?.message ?? 'Failed to fetch order details',
      );
    }
  }

  /**
   * Update a single order item status (and optionally preparedQty)
   * wrapped inside a transaction for rollback safety.
   */
  async updateItemStatus(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderItemStatusDto,
  ): Promise<OrderDocument> {
    const session = await this.orderModel.db.startSession();
    try {
      let result: OrderDocument | null = null;
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({
            _id: orderId,
            tenantId: new Types.ObjectId(tenantId),
          })
          .session(session);

        if (!order) throw new NotFoundException('Order not found');

        const item = order.items.find(
          (it) => it._id?.toString() === dto.itemId,
        );
        if (!item) throw new NotFoundException('Order item not found');

        // validate status
        if (
          !Object.values(OrderItemStatus).includes(
            dto.status as OrderItemStatus,
          )
        ) {
          throw new BadRequestException('Invalid item status');
        }

        // set status and optional preparedQty
        (item as any).status = dto.status as OrderItemStatus;
        if (dto.preparedQty !== undefined) {
          (item as any).preparedQty = Number(dto.preparedQty);
        }

        // recalc totals/status
        this.recalcOrderStatus(order);

        await order.save({ session });
        result = order;
      });

      if (result == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (result as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      // session committed successfully
      // return populated order

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update item status',
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Remake an order item: mark original REJECTED and append a new item as child.
   * Transactional for rollback safety.
   */
  // async remakeItem(
  //   tenantId: string,
  //   orderId: string,
  //   dto: RemakeOrderItemDto
  // ): Promise<OrderDocument> {
  //   const session = await this.orderModel.db.startSession();
  //   try {
  //     let result: OrderDocument | null = null;

  //     await session.withTransaction(async () => {
  //       const order = await this.orderModel
  //         .findOne({
  //           _id: orderId,
  //           tenantId: new Types.ObjectId(tenantId),
  //         })
  //         .session(session);

  //       if (!order) throw new NotFoundException("Order not found");

  //       const originalIndex = order.items.findIndex(
  //         (item) => item._id?.toString() === dto.originalItemId
  //       );

  //       if (originalIndex === -1)
  //         throw new NotFoundException("Original item not found");

  //       // mark original as rejected
  //       (order.items[originalIndex] as any).status = OrderItemStatus.REJECTED;

  //       const original: any = order.items[originalIndex];
  //       const qty = dto.qty ?? original.qty;
  //       if (qty <= 0) throw new BadRequestException("Qty must be > 0");

  //       const newItem = {
  //         _id: new Types.ObjectId(),
  //         type:
  //           (original as any).type ??
  //           dto.businessType ??
  //           BusinessType.RESTAURANT, // prefer original type

  //         menuItemId: original.menuItemId,
  //         qty,
  //         price: original.price,
  //         variant: original.variant,
  //         total: original.price * qty,
  //         status: OrderItemStatus.PENDING,
  //         preparedQty: 0,
  //         parentItemId: original._id,
  //       };

  //       order.items.push(newItem as any);
  //       order.grandTotal = order.items.reduce(
  //         (sum, i) => sum + (Number((i as any).total) || 0),
  //         0
  //       );

  //       this.recalcOrderStatus(order);
  //       await order.save({ session });

  //       result = order;
  //     });

  //     if (result == null) {
  //       throw new InternalServerErrorException("Order missing");
  //     }
  //     const id = (result as OrderDocument)._id;

  //     const fresh = await this.orderModel
  //       .findById(id)
  //       .populate("items.menuItemId")
  //       .populate("counterId")
  //       .exec();

  //     // session committed successfully
  //     // return populated order

  //     if (!fresh) {
  //       // again very unlikely; defensive programming
  //       throw new InternalServerErrorException("Created order not found");
  //     }

  //     return fresh as OrderDocument;
  //   } catch (err) {
  //     if (
  //       err instanceof NotFoundException ||
  //       err instanceof BadRequestException
  //     )
  //       throw err;
  //     throw new InternalServerErrorException(
  //       err.message || "Failed to remake item"
  //     );
  //   } finally {
  //     await session.endSession();
  //   }
  // }
  async remakeItem(
    tenantId: string,
    orderId: string,
    dto: RemakeOrderItemDto,
  ): Promise<OrderDocument> {
    const session = await this.orderModel.db.startSession();
    try {
      let result: OrderDocument | null = null;

      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({
            _id: orderId,
            tenantId: new Types.ObjectId(tenantId),
          })
          .session(session);

        if (!order) throw new NotFoundException('Order not found');

        const originalIndex = order.items.findIndex(
          (item) => item._id?.toString() === dto.originalItemId,
        );

        if (originalIndex === -1)
          throw new NotFoundException('Original item not found');

        // original subdoc
        const original: any = order.items[originalIndex];

        // determine the item type:
        // prefer the original item's discriminator type, otherwise fall back to order.businessType
        const itemType: string | undefined =
          (original && (original as any).type) || (order as any).businessType;

        if (!itemType) {
          throw new BadRequestException(
            'Cannot determine item type for remake (missing discriminator)',
          );
        }

        // mark original as rejected (only if not already final)
        (order.items[originalIndex] as any).status = OrderItemStatus.REJECTED;

        const qty = dto.qty ?? original.qty;
        if (!qty || qty <= 0) throw new BadRequestException('Qty must be > 0');

        // Build newItem according to detected type.
        // Below: implement full mappings per business type. Here we show restaurant + generic fallback.
        let newItem: any;

        if (
          itemType === (order as any).businessType ||
          itemType === 'restaurant'
        ) {
          // restaurant remake (copy relevant restaurant fields)
          newItem = {
            _id: new Types.ObjectId(),
            type: itemType,
            menuItemId: original.menuItemId,
            qty,
            price: original.price,
            variant: original.variant ?? null,
            total: Number(original.price) * Number(qty),
            status: OrderItemStatus.PENDING,
            preparedQty: 0,
            parentItemId: original._id,
          };
        } else if (itemType === 'retail') {
          newItem = {
            _id: new Types.ObjectId(),
            type: itemType,
            productId: original.productId,
            sku: original.sku ?? undefined,
            qty,
            unitPrice: original.unitPrice ?? original.price ?? 0,
            total: (original.unitPrice ?? original.price ?? 0) * qty,
            warehouseId: original.warehouseId ?? undefined,
            parentItemId: original._id,
          };
        } else if (itemType === 'service') {
          newItem = {
            _id: new Types.ObjectId(),
            type: itemType,
            serviceId: original.serviceId,
            serviceName: original.serviceName,
            durationMinutes: original.durationMinutes ?? 0,
            price: original.price,
            total: original.price * qty,
            assignedProviderId: original.assignedProviderId ?? undefined,
            parentItemId: original._id,
            status: 'pending',
          };
        } else if (itemType === 'ecommerce') {
          newItem = {
            _id: new Types.ObjectId(),
            type: itemType,
            productId: original.productId,
            variantId: original.variantId ?? undefined,
            qty,
            price: original.price,
            total: (original.price ?? 0) * qty,
            shippingMethod: original.shippingMethod ?? undefined,
            parentItemId: original._id,
          };
        } else {
          // fallback generic copy (keeps any fields present)
          newItem = {
            _id: new Types.ObjectId(),
            type: itemType,
            ...original,
            qty,
            total: Number((original as any).price ?? 0) * Number(qty),
            parentItemId: original._id,
            status: OrderItemStatus.PENDING,
          };
          // remove _id from spread to avoid duplicate id
          delete (newItem as any)._id;
        }

        // push new item, update grandTotal and status
        order.items.push(newItem);
        order.grandTotal = order.items.reduce(
          (sum, i) => sum + (Number((i as any).total) || 0),
          0,
        );

        this.recalcOrderStatus(order);
        await order.save({ session });

        result = order;
      });

      if (result == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (result as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      // session committed successfully
      // return populated order

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to remake item',
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Mark an order as paid (transactional).
   */
  async markPaid(tenantId: string, orderId: string): Promise<OrderDocument> {
    const session = await this.orderModel.db.startSession();
    try {
      let result: OrderDocument | null = null;
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({
            _id: orderId,
            tenantId: new Types.ObjectId(tenantId),
          })
          .session(session);

        if (!order) throw new NotFoundException('Order not found');

        order.isPaid = true;
        await order.save({ session });
        result = order;
      });

      if (result == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (result as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      // session committed successfully
      // return populated order

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to mark order paid',
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Cancel an order (transactional).
   * cancel: set order.status = CANCELLED and set non-final item statuses to CANCELLED
   */
  async cancel(tenantId: string, orderId: string): Promise<OrderDocument> {
    const session = await this.orderModel.db.startSession();
    try {
      let result: OrderDocument | null = null;
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({
            _id: orderId,
            tenantId: new Types.ObjectId(tenantId),
          })
          .session(session);

        if (!order) throw new NotFoundException('Order not found');

        order.status = OrderStatus.CANCELLED;
        order.items.forEach((i) => {
          if (
            ![OrderItemStatus.COOKED, OrderItemStatus.DELIVERED].includes(
              getItemStatus(i),
            )
          ) {
            (i as any).status = OrderItemStatus.CANCELLED;
          }
        });

        await order.save({ session });
        result = order;
      });

      if (result == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (result as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      // session committed successfully
      // return populated order

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to cancel order',
      );
    } finally {
      await session.endSession();
    }
  }

  async reorderLast(
    tenantId: string,
    dto: { counterId: string; metadata?: any; extraItems?: any[] },
  ) {
    const session = await this.orderModel.db.startSession();

    try {
      let newOrder: OrderDocument | null = null;

      await session.withTransaction(async () => {
        const lastOrder = await this.orderModel
          .findOne({ tenantId: Types.ObjectId.createFromHexString(tenantId) })
          .sort({ createdAt: -1 }) // MOST RECENT ORDER
          .session(session);

        if (!lastOrder) throw new NotFoundException('No previous order found');

        // --- Token Increment ---
        const counter = await this.counterModel.findOneAndUpdate(
          {
            _id: Types.ObjectId.createFromHexString(dto.counterId),
            tenantId: Types.ObjectId.createFromHexString(tenantId),
          },
          { $inc: { lastToken: 1 } },
          { new: true, session },
        );

        if (!counter) throw new NotFoundException('Counter not found');

        const tokenNumber = counter.lastToken;

        // ----- REBUILD items (fresh) -----
        const clonedItems = lastOrder.items.map((item: any) => {
          return {
            _id: new Types.ObjectId(),
            type: item.type, // RESTAURANT / RETAIL / SERVICE / ECOM
            menuItemId: item.menuItemId,
            productId: item.productId,
            serviceId: item.serviceId,
            variantId: item.variantId,
            qty: item.qty,
            price: item.price ?? item.unitPrice,
            variant: item.variant ?? undefined,
            unitPrice: item.unitPrice ?? undefined,
            total:
              item.price !== undefined
                ? item.price * item.qty
                : item.unitPrice * item.qty,
            status: OrderItemStatus.PENDING,
            preparedQty: 0,
          };
        });

        // ---  ADD EXTRA ITEMS IF PROVIDED ---

        let extraItemsBuilt: any[] = [];

        if (dto.extraItems?.length) {
          extraItemsBuilt = this.buildItemsForBusinessType(
            lastOrder.businessType,
            dto.extraItems,
          );
        }

        const allItems = [...clonedItems, ...extraItemsBuilt];

        const grandTotal = allItems.reduce(
          (sum, it) => sum + Number(it.total || 0),
          0,
        );

        const created = await new this.orderModel({
          tenantId: Types.ObjectId.createFromHexString(tenantId),
          businessType: lastOrder.businessType,
          counterId: Types.ObjectId.createFromHexString(dto.counterId),
          tokenNumber,
          orderNumber: `ORD-${Date.now()}`,
          status: OrderStatus.PENDING,
          items: allItems,
          paymentMode: 'cod',
          isPaid: false,
          grandTotal,
          metadata: dto.metadata ?? {},
        }).save({ session });

        newOrder = created;
      });

      if (newOrder == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (newOrder as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    } finally {
      await session.endSession();
    }
  }

  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const session = await this.orderModel.db.startSession();

    try {
      let updated: OrderDocument | null = null;

      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({
            _id: Types.ObjectId.createFromHexString(orderId),
            tenantId: Types.ObjectId.createFromHexString(tenantId),
          })
          .session(session);

        if (!order) throw new NotFoundException('Order not found');

        // -------------------------------
        // VALIDATION: Disallow invalid transitions if needed
        // -------------------------------
        const current = order.status;
        const next = dto.status;

        const INVALID = [
          [OrderStatus.DELIVERED, OrderStatus.PENDING],
          [OrderStatus.CANCELLED, OrderStatus.PENDING],
          [OrderStatus.CANCELLED, OrderStatus.READY],
          [OrderStatus.DELIVERED, OrderStatus.READY],
        ];

        if (INVALID.some(([a, b]) => a === current && b === next)) {
          throw new BadRequestException(
            `Cannot change status from ${current} → ${next}`,
          );
        }

        // -------------------------------
        // BUSINESS RULE:
        // If user marks order READY / DELIVERED,
        // update item statuses accordingly
        // -------------------------------
        if (next === OrderStatus.READY) {
          order.items.forEach((i: any) => {
            if (
              ![OrderItemStatus.CANCELLED, OrderItemStatus.REJECTED].includes(
                i.status,
              )
            ) {
              i.status = OrderItemStatus.COOKED;
              i.preparedQty = i.qty;
            }
          });
        }

        if (next === OrderStatus.DELIVERED) {
          order.items.forEach((i: any) => {
            if (
              ![OrderItemStatus.CANCELLED, OrderItemStatus.REJECTED].includes(
                i.status,
              )
            ) {
              i.status = OrderItemStatus.DELIVERED;
              i.preparedQty = i.qty;
            }
          });
        }

        if (next === OrderStatus.CANCELLED) {
          order.items.forEach((i: any) => {
            if (
              ![OrderItemStatus.COOKED, OrderItemStatus.DELIVERED].includes(
                i.status,
              )
            ) {
              i.status = OrderItemStatus.CANCELLED;
            }
          });
        }

        // -------------------------------
        // APPLY UPDATE
        // -------------------------------
        order.status = next;
        await order.save({ session });
        updated = order;
      });

      if (updated == null) {
        throw new InternalServerErrorException('Order missing');
      }
      const id = (updated as OrderDocument)._id;

      const fresh = await this.orderModel
        .findById(id)
        .populate('items.menuItemId')
        .populate('counterId')
        .exec();

      if (!fresh) {
        // again very unlikely; defensive programming
        throw new InternalServerErrorException('Created order not found');
      }

      return fresh as OrderDocument;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;

      throw new InternalServerErrorException(
        err.message || 'Failed to update order status',
      );
    } finally {
      await session.endSession();
    }
  }
}
