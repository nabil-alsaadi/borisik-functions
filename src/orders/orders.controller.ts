import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrderFilesDto, OrderFilesPaginator } from './dto/get-downloads.dto';
import { GetOrderStatusesDto } from './dto/get-order-statuses.dto';
import { GetOrdersDto, OrderPaginator } from './dto/get-orders.dto';
import { OrderPaymentDto } from './dto/order-payment.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutVerificationDto } from './dto/verify-checkout.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post('checkout/verify')
  verifyCheckout(@Body() query: CheckoutVerificationDto) {
    return this.ordersService.verifyCheckout(query);
  }
  @Get('seen')
  updateSeen(@Query('id') id: string) {
    return this.ordersService.orderSeen(id);
  }
  
  @Post()
  async create(@Req() req,@Body() createOrderDto: CreateOrderDto, @Headers('x-environment') environment: string): Promise<Order> {
    console.log('async create(@Req() environment============',environment)
    return this.ordersService.create(createOrderDto, req.user,environment);
  }

  @Get()
  async getOrders(@Req() req,@Query() query: GetOrdersDto): Promise<OrderPaginator> {
    // throw new UnauthorizedException();
    return this.ordersService.getOrders(query,req.user);
  }
  

  @Get(':id')
  getOrderById(@Param('id') id: string, @Query('language') language) {
    return this.ordersService.getOrderByIdOrTrackingNumber(id);
  }

  @Get('tracking-number/:tracking_id')
  getOrderByTrackingNumber(@Param('tracking_id') tracking_id: string) {
    return this.ordersService.getOrderByIdOrTrackingNumber(tracking_id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

  
  @Post('/payment')
  @HttpCode(200)
  async submitPayment(@Body() orderPaymentDto: OrderPaymentDto): Promise<void> {
    const { tracking_number } = orderPaymentDto;
    const order: Order = await this.ordersService.getOrderByIdOrTrackingNumber(
      tracking_number,
    );
    switch (order.payment_gateway.toString().toLowerCase()) {
      case 'stripe':
        this.ordersService.stripePay(order);
        break;
      case 'paypal':
        // this.ordersService.paypalPay(order);
        break;
      default:
        break;
    }
    // this.ordersService.processChildrenOrder(order);
  }
}

@Controller('order-status')
export class OrderStatusController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderStatusDto: CreateOrderStatusDto) {
    return this.ordersService.createOrderStatus(createOrderStatusDto);
  }

  @Get()
  findAll(@Query() query: GetOrderStatusesDto) {
    return this.ordersService.getOrderStatuses(query);
  }

  @Get(':param')
  findOne(@Param('param') param: string, @Query('language') language: string) {
    return this.ordersService.getOrderStatus(param, language);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}

@Controller('downloads')
export class OrderFilesController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async getOrderFileItems(
    @Query() query: GetOrderFilesDto,
  ): Promise<OrderFilesPaginator> {
    return this.ordersService.getOrderFileItems(query);
  }

  @Post('digital_file')
  async getDigitalFileDownloadUrl(
    @Body('digital_file_id', ParseIntPipe) digitalFileId: number,
  ) {
    return this.ordersService.getDigitalFileDownloadUrl(digitalFileId);
  }
}

@Controller('export-order-url')
export class OrderExportController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async orderExport(@Query('shop_id') shop_id: string) {
    return this.ordersService.exportOrder(shop_id);
  }
}

@Controller('download-invoice-url')
export class DownloadInvoiceController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async downloadInvoiceUrl(@Body('shop_id') shop_id: string) {
    return this.ordersService.downloadInvoiceUrl(shop_id);
  }
}
