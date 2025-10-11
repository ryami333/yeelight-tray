import { z } from "zod";

export const createJsonCode = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err) {
        if (err instanceof SyntaxError) {
          ctx.issues.push({
            code: "invalid_format",
            format: "json",
            input: jsonString,
            message: err.message,
          });
          return z.NEVER;
        }
        throw err;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
