ALTER TABLE "User" ADD CONSTRAINT "User_name_not_blank" CHECK (length(btrim("name")) > 0);
ALTER TABLE "User" ADD CONSTRAINT "User_email_not_blank" CHECK (length(btrim("email")) > 0);

ALTER TABLE "Category" ADD CONSTRAINT "Category_name_not_blank" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_not_blank" CHECK (length(btrim("slug")) > 0);

ALTER TABLE "Product" ADD CONSTRAINT "Product_name_not_blank" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_not_blank" CHECK (length(btrim("slug")) > 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_valid" CHECK ("priceCents" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" >= 0);

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_range" CHECK ("quantity" >= 1 AND "quantity" <= 99);

ALTER TABLE "Order" ADD CONSTRAINT "Order_orderNumber_not_blank" CHECK (length(btrim("orderNumber")) > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_subtotal_nonnegative" CHECK ("subtotalCents" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_shipping_nonnegative" CHECK ("shippingCents" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_tax_nonnegative" CHECK ("taxCents" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_nonnegative" CHECK ("totalCents" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_currency_usd" CHECK ("currency" = 'USD');

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productName_not_blank" CHECK (length(btrim("productName")) > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unit_price_nonnegative" CHECK ("unitPriceCents" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_range" CHECK ("quantity" >= 1 AND "quantity" <= 99);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_line_total_nonnegative" CHECK ("lineTotalCents" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_line_total_matches" CHECK ("lineTotalCents" = "unitPriceCents" * "quantity");
