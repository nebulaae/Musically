import { z } from 'zod';

// AUTH VALIDATION
// REGISTER VALIDATION
export const registerSchema = z.object({
    username: z.string()
        .min(3, { message: "Длина имени пользователя должна быть не меньше 3 символов." })
        .max(50, { message: "Длина имени пользователя должна не превышать 50 символов." }),
    email: z.string()
        .email({ message: "Неверный формат электронной почты." }),
    password: z.string()
        .min(8, { message: "Длина пароля должна быть не меньше 8 символов." })
        .max(50, { message: "Длина пароля должна не превышать 50 символов." }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// LOGIN VALIDATION
export const loginSchema = z.object({
    username: z.string()
        .min(3, { message: "Длина имени пользователя должна быть не меньше 3 символов." })
        .max(50, { message: "Длина имени пользователя должна не превышать 50 символов." }),
    password: z.string().min(8).max(50)
        .min(8, { message: "Длина пароля должна быть не меньше 8 символов." })
        .max(50, { message: "Длина пароля должна не превышать 50 символов." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;