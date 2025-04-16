import { z } from 'zod';

// AUTH VALIDATION
// REGISTER VALIDATION
export const formSchema = z.object({
    username: z.string()
        .min(3, { message: "Длина имени пользователя должна быть не меньше 3 символов." })
        .max(50, { message: "Длина имени пользователя должна не превышать 50 символов." }),
    email: z.string()
        .email({ message: "Неверный формат электронной почты." }),
    password: z.string()
        .min(8, { message: "Длина пароля должна быть не меньше 8 символов." })
        .max(50, { message: "Длина пароля должна не превышать 50 символов." }),
});

export type RegisterFormValues = z.infer<typeof formSchema>;

// LOGIN VALIDATION
