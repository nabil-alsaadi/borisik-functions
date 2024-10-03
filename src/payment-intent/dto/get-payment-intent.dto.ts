export class GetPaymentIntentDto {
  tracking_number: string;
  payment_gateway: string;
  recall_gateway: boolean;
}
