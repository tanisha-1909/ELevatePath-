-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_industry_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "industryInsightId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_industryInsightId_fkey" FOREIGN KEY ("industryInsightId") REFERENCES "public"."IndustryInsight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
