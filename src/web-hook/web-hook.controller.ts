import { WebHookService } from './web-hook.service';
import { Controller, Get, Post, Headers, Req } from '@nestjs/common';

@Controller('web-hook')
export class WebHookController {
  constructor(private readonly webHookServices: WebHookService) {}
  @Get('razorpay')
  razorPay(@Req() req: Request) {
    const rawBody = req.body;
    return this.webHookServices.razorPay();
  }
  @Post('stripe')
  async stripe(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    //@ts-ignore
    const rawBody = req.rawBody;
    console.log('stripe input=============================',rawBody,signature)
    return this.webHookServices.stripe(rawBody,signature,'production');
  }
  @Post('stripe-testing')
  async stripeTesting(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    //@ts-ignore
    const rawBody = req.rawBody;
    console.log('stripe input=============================',rawBody,signature)
    return this.webHookServices.stripe(rawBody,signature,'testing');
  }
  @Get('paypal')
  paypal() {
    return this.webHookServices.paypal();
  }
}
