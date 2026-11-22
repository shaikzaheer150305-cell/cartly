ALTER TABLE "Order" DROP CONSTRAINT "Order_currency_usd";

ALTER TABLE "Order" ADD CONSTRAINT "Order_currency_inr" CHECK ("currency" IN ('INR', 'USD'));

ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'INR';
