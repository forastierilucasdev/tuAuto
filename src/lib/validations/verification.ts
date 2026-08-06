import { z } from "zod";
import { dniSchema, fullNameSchema, phoneSchema } from "./shared";

export const verificationRequestSchema = z.object({
  fullName: fullNameSchema,
  dni: dniSchema,
  phone: phoneSchema,
});
