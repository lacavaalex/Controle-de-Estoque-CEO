CREATE TYPE "public"."origem_canal" AS ENUM('sistema', 'email');--> statement-breakpoint
CREATE TYPE "public"."status_triagem" AS ENUM('pendente', 'aprovado', 'descartado');--> statement-breakpoint
CREATE TABLE "pedido_rascunho" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"email_cru" text NOT NULL,
	"json_extraido" jsonb,
	"remetente_email" text,
	"remetente_nome" text,
	"confianca_geral" real,
	"status_triagem" "status_triagem" DEFAULT 'pendente' NOT NULL,
	"tem_anexo" boolean DEFAULT false NOT NULL,
	"pedido_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pedido" ADD COLUMN "origem_canal" "origem_canal" DEFAULT 'sistema' NOT NULL;--> statement-breakpoint
ALTER TABLE "pedido" ADD COLUMN "remetente_email" text;--> statement-breakpoint
ALTER TABLE "pedido" ADD COLUMN "remetente_nome" text;--> statement-breakpoint
ALTER TABLE "pedido_rascunho" ADD CONSTRAINT "pedido_rascunho_pedido_id_pedido_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedido"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pedido_rascunho_message_id_unico" ON "pedido_rascunho" USING btree ("message_id");