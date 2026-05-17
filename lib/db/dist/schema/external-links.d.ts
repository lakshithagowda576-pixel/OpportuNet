export declare const externalLinksTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "external_links";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "external_links";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        jobId: import("drizzle-orm/pg-core").PgColumn<{
            name: "job_id";
            tableName: "external_links";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        officialUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "official_url";
            tableName: "external_links";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lastVerified: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_verified";
            tableName: "external_links";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "external_links";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertExternalLinkSchema: import("zod/v4").ZodObject<{
    jobId: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodInt>>;
    officialUrl: import("zod/v4").ZodString;
    lastVerified: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodDate>>;
    isActive: import("zod/v4").ZodOptional<import("zod/v4").ZodBoolean>;
}, {
    out: {};
    in: {};
}>;
export type InsertExternalLink = typeof externalLinksTable.$inferInsert;
export type ExternalLink = typeof externalLinksTable.$inferSelect;
//# sourceMappingURL=external-links.d.ts.map