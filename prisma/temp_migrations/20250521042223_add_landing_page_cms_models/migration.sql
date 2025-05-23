-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("businessId","categoryId")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "businessId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingBusiness" (
    "business_id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price_range" TEXT,
    "category_name" TEXT,
    "address" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "state" TEXT,
    "country_code" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "description" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "place_id" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "temporarily_closed" BOOLEAN DEFAULT false,
    "permanently_closed" BOOLEAN DEFAULT false,
    "operational_status" TEXT,
    "fid" TEXT,
    "cid" TEXT,
    "reviews_count" INTEGER DEFAULT 0,
    "images_count" INTEGER DEFAULT 0,
    "scraped_at" TIMESTAMP(3),
    "google_food_url" TEXT,
    "url" TEXT,
    "search_page_url" TEXT,
    "search_string" TEXT,
    "language" TEXT,
    "rank" INTEGER,
    "is_advertisement" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "kgmid" TEXT,
    "sub_title" TEXT,
    "located_in" TEXT,
    "plus_code" TEXT,
    "menu_url" TEXT,
    "reserve_table_url" TEXT,
    "popular_times_live_text" TEXT,
    "popular_times_live_percent" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingBusiness_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "ListingCategory" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,

    CONSTRAINT "ListingCategory_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "ListingBusinessCategory" (
    "listing_business_id" BIGINT NOT NULL,
    "listing_category_id" INTEGER NOT NULL,

    CONSTRAINT "ListingBusinessCategory_pkey" PRIMARY KEY ("listing_business_id","listing_category_id")
);

-- CreateTable
CREATE TABLE "ListingImageCategory" (
    "image_category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,

    CONSTRAINT "ListingImageCategory_pkey" PRIMARY KEY ("image_category_id")
);

-- CreateTable
CREATE TABLE "ListingBusinessImageCategory" (
    "listing_business_id" BIGINT NOT NULL,
    "listing_image_category_id" INTEGER NOT NULL,

    CONSTRAINT "ListingBusinessImageCategory_pkey" PRIMARY KEY ("listing_business_id","listing_image_category_id")
);

-- CreateTable
CREATE TABLE "ListingOpeningHour" (
    "opening_hour_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "hours" TEXT NOT NULL,

    CONSTRAINT "ListingOpeningHour_pkey" PRIMARY KEY ("opening_hour_id")
);

-- CreateTable
CREATE TABLE "ListingPeopleAlsoSearch" (
    "pas_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "pas_category" TEXT,
    "pas_title" TEXT NOT NULL,
    "pas_reviews_count" INTEGER,
    "pas_total_score" DECIMAL(65,30),

    CONSTRAINT "ListingPeopleAlsoSearch_pkey" PRIMARY KEY ("pas_id")
);

-- CreateTable
CREATE TABLE "ListingReviewTag" (
    "review_tag_id" SERIAL NOT NULL,
    "tag_name" TEXT NOT NULL,
    "count" INTEGER,

    CONSTRAINT "ListingReviewTag_pkey" PRIMARY KEY ("review_tag_id")
);

-- CreateTable
CREATE TABLE "ListingBusinessReviewTag" (
    "listing_business_id" BIGINT NOT NULL,
    "listing_review_tag_id" INTEGER NOT NULL,

    CONSTRAINT "ListingBusinessReviewTag_pkey" PRIMARY KEY ("listing_business_id","listing_review_tag_id")
);

-- CreateTable
CREATE TABLE "ListingAttribute" (
    "attribute_id" SERIAL NOT NULL,
    "attribute_key" TEXT NOT NULL,
    "attribute_value" TEXT,
    "icon_url" TEXT,

    CONSTRAINT "ListingAttribute_pkey" PRIMARY KEY ("attribute_id")
);

-- CreateTable
CREATE TABLE "ListingBusinessAttribute" (
    "listing_business_id" BIGINT NOT NULL,
    "listing_attribute_id" INTEGER NOT NULL,
    "value" TEXT,

    CONSTRAINT "ListingBusinessAttribute_pkey" PRIMARY KEY ("listing_business_id","listing_attribute_id")
);

-- CreateTable
CREATE TABLE "ListingReviewsDistribution" (
    "reviews_distribution_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "one_star" INTEGER,
    "two_stars" INTEGER,
    "three_stars" INTEGER,
    "four_stars" INTEGER,
    "five_stars" INTEGER,

    CONSTRAINT "ListingReviewsDistribution_pkey" PRIMARY KEY ("reviews_distribution_id")
);

-- CreateTable
CREATE TABLE "ListingOrderProvider" (
    "order_provider_id" SERIAL NOT NULL,
    "provider_name" TEXT NOT NULL,

    CONSTRAINT "ListingOrderProvider_pkey" PRIMARY KEY ("order_provider_id")
);

-- CreateTable
CREATE TABLE "ListingBusinessOrderLink" (
    "business_order_link_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "listing_order_provider_id" INTEGER,
    "link_type" TEXT,
    "url" TEXT NOT NULL,

    CONSTRAINT "ListingBusinessOrderLink_pkey" PRIMARY KEY ("business_order_link_id")
);

-- CreateTable
CREATE TABLE "ListingImageUrl" (
    "image_url_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "is_cover_image" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ListingImageUrl_pkey" PRIMARY KEY ("image_url_id")
);

-- CreateTable
CREATE TABLE "ListingReview" (
    "review_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "reviewer_name" TEXT,
    "reviewer_id" TEXT,
    "reviewer_avatar_url" TEXT,
    "review_text" TEXT,
    "rating" DECIMAL(65,30),
    "published_at_string" TEXT,
    "published_at_date" TIMESTAMP(3),
    "response_from_owner_text" TEXT,
    "response_from_owner_date" TIMESTAMP(3),
    "review_link" TEXT,
    "review_source" TEXT,

    CONSTRAINT "ListingReview_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "ListingReviewImageUrl" (
    "review_image_url_id" BIGSERIAL NOT NULL,
    "listing_review_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ListingReviewImageUrl_pkey" PRIMARY KEY ("review_image_url_id")
);

-- CreateTable
CREATE TABLE "ListingPopularTimesHistogram" (
    "histogram_id" BIGSERIAL NOT NULL,
    "listing_business_id" BIGINT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "hour_of_day" INTEGER NOT NULL,
    "occupancy_percent" INTEGER,

    CONSTRAINT "ListingPopularTimesHistogram_pkey" PRIMARY KEY ("histogram_id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "label" TEXT,
    "group" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PartnerLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_businessId_key" ON "Review"("userId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ListingBusiness_place_id_key" ON "ListingBusiness"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingCategory_category_name_key" ON "ListingCategory"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImageCategory_category_name_key" ON "ListingImageCategory"("category_name");

-- CreateIndex
CREATE INDEX "ListingOpeningHour_listing_business_id_idx" ON "ListingOpeningHour"("listing_business_id");

-- CreateIndex
CREATE INDEX "ListingPeopleAlsoSearch_listing_business_id_idx" ON "ListingPeopleAlsoSearch"("listing_business_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingReviewTag_tag_name_key" ON "ListingReviewTag"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingReviewsDistribution_listing_business_id_key" ON "ListingReviewsDistribution"("listing_business_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingOrderProvider_provider_name_key" ON "ListingOrderProvider"("provider_name");

-- CreateIndex
CREATE INDEX "ListingBusinessOrderLink_listing_business_id_idx" ON "ListingBusinessOrderLink"("listing_business_id");

-- CreateIndex
CREATE INDEX "ListingBusinessOrderLink_listing_order_provider_id_idx" ON "ListingBusinessOrderLink"("listing_order_provider_id");

-- CreateIndex
CREATE INDEX "ListingImageUrl_listing_business_id_idx" ON "ListingImageUrl"("listing_business_id");

-- CreateIndex
CREATE INDEX "ListingReviewImageUrl_listing_review_id_idx" ON "ListingReviewImageUrl"("listing_review_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPopularTimesHistogram_listing_business_id_day_of_wee_key" ON "ListingPopularTimesHistogram"("listing_business_id", "day_of_week", "hour_of_day");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCategory" ADD CONSTRAINT "BusinessCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCategory" ADD CONSTRAINT "BusinessCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessCategory" ADD CONSTRAINT "ListingBusinessCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessCategory" ADD CONSTRAINT "ListingBusinessCategory_listing_category_id_fkey" FOREIGN KEY ("listing_category_id") REFERENCES "ListingCategory"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessImageCategory" ADD CONSTRAINT "ListingBusinessImageCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessImageCategory" ADD CONSTRAINT "ListingBusinessImageCategory_listing_image_category_id_fkey" FOREIGN KEY ("listing_image_category_id") REFERENCES "ListingImageCategory"("image_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingOpeningHour" ADD CONSTRAINT "ListingOpeningHour_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPeopleAlsoSearch" ADD CONSTRAINT "ListingPeopleAlsoSearch_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessReviewTag" ADD CONSTRAINT "ListingBusinessReviewTag_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessReviewTag" ADD CONSTRAINT "ListingBusinessReviewTag_listing_review_tag_id_fkey" FOREIGN KEY ("listing_review_tag_id") REFERENCES "ListingReviewTag"("review_tag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessAttribute" ADD CONSTRAINT "ListingBusinessAttribute_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessAttribute" ADD CONSTRAINT "ListingBusinessAttribute_listing_attribute_id_fkey" FOREIGN KEY ("listing_attribute_id") REFERENCES "ListingAttribute"("attribute_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewsDistribution" ADD CONSTRAINT "ListingReviewsDistribution_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessOrderLink" ADD CONSTRAINT "ListingBusinessOrderLink_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessOrderLink" ADD CONSTRAINT "ListingBusinessOrderLink_listing_order_provider_id_fkey" FOREIGN KEY ("listing_order_provider_id") REFERENCES "ListingOrderProvider"("order_provider_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImageUrl" ADD CONSTRAINT "ListingImageUrl_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReview" ADD CONSTRAINT "ListingReview_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewImageUrl" ADD CONSTRAINT "ListingReviewImageUrl_listing_review_id_fkey" FOREIGN KEY ("listing_review_id") REFERENCES "ListingReview"("review_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPopularTimesHistogram" ADD CONSTRAINT "ListingPopularTimesHistogram_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;
