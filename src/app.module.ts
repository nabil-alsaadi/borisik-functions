import { MessagesModule } from './messages/messages.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressesModule } from './addresses/addresses.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { CouponsModule } from './coupons/coupons.module';
import { FeedbackModule } from './feedbacks/feedbacks.module';
import { ImportsModule } from './imports/imports.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentIntentModule } from './payment-intent/payment-intent.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PaymentModule } from './payment/payment.module';
import { ProductsModule } from './products/products.module';
import { QuestionModule } from './questions/questions.module';
import { RefundsModule } from './refunds/refunds.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { ShippingsModule } from './shippings/shippings.module';
import { ShopsModule } from './shops/shops.module';
import { TagsModule } from './tags/tags.module';
import { TaxesModule } from './taxes/taxes.module';
import { TypesModule } from './types/types.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { WebHookModule } from './web-hook/web-hook.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { WithdrawsModule } from './withdraws/withdraws.module';
import { StoreNoticesModule } from './store-notices/store-notices.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AiModule } from './ai/ai.module';
import { FaqsModule } from './faqs/faqs.module';
import { TermsAndConditionsModule } from './terms-and-conditions/terms-and-conditions.module';
import { FlashSaleModule } from './flash-sale/flash-sale.module';
import { RefundPoliciesModule } from './refund-policies/refund-policies.module';
import { RefundReasonModule } from './refund-reasons/refund-reasons.module';
import { NotifyLogsModule } from './notify-logs/notify-logs.module';
import { FirebaseModule } from './firebase/firebase.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { STRIPE_API_KEY } from './utils/config.util';
import { PublicationsModule } from './publications/publications.module';
import { VacanciesModule } from './vacancies/vacancies.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    
    ConfigModule.forRoot(),
    // StripeModule.forRoot({
    //   apiKey: STRIPE_API_KEY.value(),
    //   apiVersion: '2022-11-15',
    // }),
    // StripeModule.forRootAsync({
    //   useFactory: async () => {
    //     const config = await getConfig();  // Assuming your getConfig() is sync except secrets
    //     return {
    //       apiKey: config.stripeApiKey, // Fetch secret during runtime
    //       apiVersion: '2022-11-15',
    //     };
    //   },
    // }),
    AuthModule,
    UsersModule,
    FirebaseModule,
    CommonModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    AnalyticsModule,
    AttributesModule,
    ShippingsModule,
    TaxesModule,
    TagsModule,
    ShopsModule,
    TypesModule,
    WithdrawsModule,
    UploadsModule,
    SettingsModule,
    CouponsModule,
    AddressesModule,
    ImportsModule,
    
    RefundsModule,
    AuthorsModule,
    ManufacturersModule,
    NewslettersModule,
    ReviewModule,
    QuestionModule,
    WishlistsModule,
    ReportsModule,
    FeedbackModule,
    PaymentMethodModule,
    PaymentIntentModule,
    WebHookModule,
    PaymentModule,
    StoreNoticesModule,
    ConversationsModule,
    MessagesModule,
    AiModule,
    FaqsModule,
    NotifyLogsModule,
    TermsAndConditionsModule,
    FlashSaleModule,
    RefundPoliciesModule,
    RefundReasonModule,
    PublicationsModule,
    VacanciesModule,
    ApplicationsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Apply logger middleware globally
  }
}
