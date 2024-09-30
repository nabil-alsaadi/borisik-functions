import { IsArray, ValidateNested } from 'class-validator';
import { ConnectProductOrderPivot, UserAddressInput } from './create-order.dto';
import { Type } from 'class-transformer';

export class CheckoutVerificationDto {
  amount: number;
  products: ConnectProductOrderPivot[];
  shipping_address?: UserAddressInput;
  customer_id?: string;
}

export class VerifiedCheckoutData {
  total_tax: number;
  shipping_charge: number;
  unavailable_products: string[];
  available_products: ConnectProductOrderPivot[];
  wallet_currency: number;
  wallet_amount: number;
  subtotal: number;
  total: number;
}
