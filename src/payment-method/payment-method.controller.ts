import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Headers
} from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { GetPaymentMethodsDto } from './dto/get-payment-methods.dto';
import { DefaultCart } from './dto/set-default-card.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodService } from './payment-method.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('cards')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  create(@Req() req,@Body() createPaymentMethodDto: CreatePaymentMethodDto,@Headers('x-environment') environment: string) {
    console.log('req.user================',req.user)
    return this.paymentMethodService.create(createPaymentMethodDto,req.user,environment);
  }

  @Get()
  findAll(@Query() getTaxesDto: GetPaymentMethodsDto,@Req() req,@Headers('x-environment') environment: string) {
    return this.paymentMethodService.findAll(req.user,environment);
  }

  @Get(':id')
  findOne(@Param('id') id: string,@Req() req,@Headers('x-environment') environment: string) {
    return this.paymentMethodService.findOne(+id,req.user,environment);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaxDto: UpdatePaymentMethodDto,
    @Headers('x-environment') environment: string
  ) {
    return this.paymentMethodService.update(+id, updateTaxDto,environment);
  }

  @Delete(':id')
  remove(@Param('id') id: string,@Req() req,@Headers('x-environment') environment: string) {
    return this.paymentMethodService.remove(+id,req.user,environment);
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('/save-payment-method')
export class SavePaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  savePaymentMethod(@Req() req,@Body() createPaymentMethodDto: CreatePaymentMethodDto,@Headers('x-environment') environment: string) {
    createPaymentMethodDto.default_card = false;
    console.log(req.user)
    return this.paymentMethodService.savePaymentMethod(createPaymentMethodDto,req.user,environment);
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('/set-default-card')
export class SetDefaultCartController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}
  @Post()
  setDefaultCart(@Body() defaultCart: DefaultCart,@Req() req,@Headers('x-environment') environment: string) {
    return this.paymentMethodService.saveDefaultCart(defaultCart, req.user,environment);
  }
}
