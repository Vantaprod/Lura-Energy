ALTER TABLE "AdminInvitation" DROP CONSTRAINT "AdminInvitation_inviterId_fkey";
ALTER TABLE "AdminInvitation" ALTER COLUMN "inviterId" DROP NOT NULL;
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;