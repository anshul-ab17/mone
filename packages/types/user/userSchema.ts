import { z } from "zod";

export class UserSchemas {
  public static idParam = z.object({
    id: z.string().uuid(),
  });
}

export type UserIdParam = z.infer<typeof UserSchemas.idParam>;