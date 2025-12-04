// src/orders/orders.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from './dto/update-order-item-status.dto';
import { RemakeOrderItemDto } from './dto/remake-order-item.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders
  @Post()
  create(@Tenant() tenantId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(tenantId, dto);
  }

  // GET /orders
  @Get()
  findAll(@Tenant() tenantId: string) {
    return this.ordersService.findAll(tenantId);
  }

  // GET /orders/:id
  @Get(':id')
  findOne(@Tenant() tenantId: string, @Param('id') id: string) {
    return this.ordersService.findOne(tenantId, id);
  }

  // PATCH /orders/:id/items/status
  @Patch('items/status/:id')
  updateItemStatus(
    @Tenant() tenantId: string,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.ordersService.updateItemStatus(tenantId, orderId, dto);
  }

  // POST /orders/:id/items/remake
  @Post('items/remake/:id')
  remakeItem(
    @Tenant() tenantId: string,
    @Param('id') orderId: string,
    @Body() dto: RemakeOrderItemDto,
  ) {
    return this.ordersService.remakeItem(tenantId, orderId, dto);
  }

  // PATCH /orders/:id/paid
  @Patch('paid/:id')
  markPaid(@Tenant() tenantId: string, @Param('id') orderId: string) {
    return this.ordersService.markPaid(tenantId, orderId);
  }

  // PATCH /orders/:id/cancel
  @Patch('cancel/:id')
  cancel(@Tenant() tenantId: string, @Param('id') orderId: string) {
    return this.ordersService.cancel(tenantId, orderId);
  }

  @Post('reorder-last')
  async reorderLast(
    @Tenant() tenantId: string,
    @Body() dto: { counterId: string; metadata?: any },
  ) {
    return this.ordersService.reorderLast(tenantId, dto);
  }

  @Patch('status/:orderId')
  async updateOrderStatus(
    @Tenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(tenantId, orderId, dto);
  }
}
