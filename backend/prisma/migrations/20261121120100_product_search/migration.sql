ALTER TABLE "Product"
DROP COLUMN "searchVector",
ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
    to_tsvector('english'::regconfig, coalesce("name", '') || ' ' || coalesce("description", ''))
) STORED;

CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");
