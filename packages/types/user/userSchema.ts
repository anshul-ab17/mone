import { z } from "zod";

export class UserSchemas {
  public static idParam = z.object({
    id: z.uuid(),
  });
}

export type UserIdParam = z.infer<typeof UserSchemas.idParam>;