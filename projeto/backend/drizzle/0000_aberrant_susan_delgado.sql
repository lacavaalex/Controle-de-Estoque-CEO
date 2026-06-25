CREATE TYPE "public"."categoria" AS ENUM('EPI', 'Anestésico', 'Material Restaurador', 'Instrumentais', 'Higienização', 'Material Cirúrgico', 'Equipamento', 'Outros');--> statement-breakpoint
CREATE TYPE "public"."estado_lote" AS ENUM('ativo', 'vencido', 'segregado');--> statement-breakpoint
CREATE TYPE "public"."motivo_divergencia" AS ENUM('falta_estoque', 'racionalizacao_setor', 'lote_indisponivel', 'outros');--> statement-breakpoint
CREATE TYPE "public"."perfil" AS ENUM('gestor', 'almoxarife', 'solicitante', 'dentista');--> statement-breakpoint
CREATE TYPE "public"."status_item" AS ENUM('pendente', 'aguardando_reposicao', 'atendido_integral', 'atendido_parcial', 'nao_atendido');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('pendente', 'em_processamento', 'atendido_integral', 'atendido_parcial', 'nao_atendido', 'aguardando_reposicao');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimentacao" AS ENUM('entrada', 'saida', 'ajuste', 'consumo', 'segregacao');--> statement-breakpoint
CREATE TYPE "public"."tipo_setor" AS ENUM('almoxarifado', 'destinatario');--> statement-breakpoint
CREATE TYPE "public"."unidade" AS ENUM('caixa', 'tubo', 'seringa', 'kit', 'pacote', 'rolo', 'unidade', 'frasco', 'bastão', 'folha', 'par');--> statement-breakpoint
CREATE TABLE "item_do_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" text NOT NULL,
	"produto_id" integer,
	"descricao_livre" text,
	"qtd_solicitada" integer NOT NULL,
	"qtd_expedida" integer,
	"lote_expedido_id" integer,
	"unidade" "unidade" NOT NULL,
	"status_item" "status_item" DEFAULT 'pendente' NOT NULL,
	"motivo_divergencia" "motivo_divergencia",
	"observacao_motivo" text,
	"item_pai_id" integer,
	"processado_por_id" integer,
	"data_processamento" timestamp with time zone,
	CONSTRAINT "item_qtd_solicitada_minima" CHECK ("item_do_pedido"."qtd_solicitada" >= 1),
	CONSTRAINT "item_qtd_expedida_nao_negativa" CHECK ("item_do_pedido"."qtd_expedida" IS NULL OR "item_do_pedido"."qtd_expedida" >= 0),
	CONSTRAINT "item_produto_xor_descricao" CHECK (("item_do_pedido"."produto_id" IS NOT NULL) <> ("item_do_pedido"."descricao_livre" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "lote" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"setor_id" integer NOT NULL,
	"numero_lote" text NOT NULL,
	"fabricacao" date,
	"validade" date NOT NULL,
	"quantidade" integer NOT NULL,
	"estado" "estado_lote" DEFAULT 'ativo' NOT NULL,
	"data_segregacao" date,
	"observacao_segregacao" text,
	CONSTRAINT "lote_quantidade_nao_negativa" CHECK ("lote"."quantidade" >= 0),
	CONSTRAINT "lote_segregado_tem_data" CHECK (("lote"."estado" <> 'segregado') OR ("lote"."data_segregacao" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "movimentacao" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo" "tipo_movimentacao" NOT NULL,
	"lote_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	"quantidade" integer NOT NULL,
	"setor_origem_id" integer NOT NULL,
	"setor_destino_id" integer,
	"responsavel_id" integer NOT NULL,
	"data" timestamp with time zone DEFAULT now() NOT NULL,
	"pedido_id" text,
	"observacao" text
);
--> statement-breakpoint
CREATE TABLE "pedido" (
	"id" text PRIMARY KEY NOT NULL,
	"setor_origem_id" integer NOT NULL,
	"setor_destino_id" integer NOT NULL,
	"solicitante_id" integer NOT NULL,
	"data_criacao" timestamp with time zone DEFAULT now() NOT NULL,
	"justificativa" text NOT NULL,
	"status" "status_pedido" DEFAULT 'pendente' NOT NULL,
	CONSTRAINT "pedido_justificativa_minima" CHECK (char_length("pedido"."justificativa") >= 10)
);
--> statement-breakpoint
CREATE TABLE "produto" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"categoria" "categoria" NOT NULL,
	"unidade" "unidade" NOT NULL,
	"estoque_minimo" integer DEFAULT 0 NOT NULL,
	"estoque_maximo" integer DEFAULT 9999 NOT NULL,
	"localizacao" text,
	"fornecedor" text,
	CONSTRAINT "produto_estoque_minimo_nao_negativo" CHECK ("produto"."estoque_minimo" >= 0),
	CONSTRAINT "produto_estoque_maximo_nao_negativo" CHECK ("produto"."estoque_maximo" >= 0)
);
--> statement-breakpoint
CREATE TABLE "setor" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_setor" NOT NULL,
	"email_institucional" text
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"cargo" text NOT NULL,
	"perfil" "perfil" NOT NULL,
	"setor_id" integer NOT NULL,
	"avatar" varchar(2),
	"senha_hash" text,
	"trocar_senha" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_ufpe" CHECK ("usuario"."email" LIKE '%@ufpe.br')
);
--> statement-breakpoint
ALTER TABLE "item_do_pedido" ADD CONSTRAINT "item_do_pedido_pedido_id_pedido_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedido"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_do_pedido" ADD CONSTRAINT "item_do_pedido_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_do_pedido" ADD CONSTRAINT "item_do_pedido_lote_expedido_id_lote_id_fk" FOREIGN KEY ("lote_expedido_id") REFERENCES "public"."lote"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_do_pedido" ADD CONSTRAINT "item_do_pedido_processado_por_id_usuario_id_fk" FOREIGN KEY ("processado_por_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_lote_id_lote_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_setor_origem_id_setor_id_fk" FOREIGN KEY ("setor_origem_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_setor_destino_id_setor_id_fk" FOREIGN KEY ("setor_destino_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_responsavel_id_usuario_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_pedido_id_pedido_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedido"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_setor_origem_id_setor_id_fk" FOREIGN KEY ("setor_origem_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_setor_destino_id_setor_id_fk" FOREIGN KEY ("setor_destino_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_solicitante_id_usuario_id_fk" FOREIGN KEY ("solicitante_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usuario_email_unico" ON "usuario" USING btree ("email");