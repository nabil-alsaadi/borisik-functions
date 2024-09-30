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
  create(@Req() req,@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    console.log('req.user================',req.user)
    return this.paymentMethodService.create(createPaymentMethodDto,req.user);
  }

  @Get()
  findAll(@Query() getTaxesDto: GetPaymentMethodsDto) {
    return this.paymentMethodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaxDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(+id, updateTaxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(+id);
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('/save-payment-method')
export class SavePaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  savePaymentMethod(@Req() req,@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    createPaymentMethodDto.default_card = false;
    console.log(req.user)
    return this.paymentMethodService.savePaymentMethod(createPaymentMethodDto,req.user);
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('/set-default-card')
export class SetDefaultCartController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}
  @Post()
  setDefaultCart(@Body() defaultCart: DefaultCart) {
    return this.paymentMethodService.saveDefaultCart(defaultCart);
  }
}
