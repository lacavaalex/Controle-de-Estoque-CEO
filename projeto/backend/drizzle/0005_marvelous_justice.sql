ALTER TABLE "movimentacao" DROP CONSTRAINT "movimentacao_lote_id_lote_id_fk";
--> statement-breakpoint
ALTER TABLE "movimentacao" ALTER COLUMN "lote_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_lote_id_lote_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote"("id") ON DELETE set null ON UPDATE no action;