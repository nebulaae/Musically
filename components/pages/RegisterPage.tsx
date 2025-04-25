"use client"

import Link from "next/link";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterFormValues, registerSchema } from "@/lib/validation";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Separator } from "../ui/separator";

export const RegisterPage = () => {
    // ROUTER
    const router = useRouter();
    // FORM HOOK INITIALIZATION
    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: ""
        },
    });

    // FORM HANDLER
    // This function will be called when the form is submitted successfully (passes validation).
    const onSubmit = async (values: RegisterFormValues) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await response.json();

            if (response.ok) {
                toast.success("Успешная авторизация!");
                router.push("/");
                window.location.reload();
            } else {
                if (data.errorType === 'username') {
                    form.setError('username', {
                        type: 'manual',
                        message: data.message
                    })
                } else
                    toast.error(data.message || "Не удалось авторизоваться. Попробуйте еще раз.");
            }
        } catch (err) {
            toast.error("Произошла ошибка. Пожалуйста, попробуйте позже.");
        }

        // RESET THE FORM
        form.reset();
    };

    return (
        <Form {...form}> {/* Spread form methods and state */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="container w-full max-w-[425px] space-y-4">
                <div className="flex flex-col gap-1">
                    <h1 className="title-text">Регистрация</h1>
                    <p className="subtitle-text">Заполните все поля.</p>
                </div>

                <Separator orientation="horizontal" className="bg-secondary my-4" />

                {/* USERNAME FIELD */}
                <FormField
                    control={form.control} // Connects to react-hook-form state
                    name="username"
                    render={({ field }) => ( // `field` contains value, onChange, onBlur, etc.
                        <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                                <Input placeholder="Иван Иванович..." {...field} className="purple-input" />
                            </FormControl>
                            {/* Displays validation errors for this field */}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* EMAIL FIELD */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Электронная почта</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="name@example.com" {...field} className="purple-input" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* PASSWORD FIELD */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                                {/* Use type="password" to mask input */}
                                <Input type="password" placeholder="Мой пароль..." {...field} className="purple-input" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* SUBMIT BUTTON */}
                <Button
                    type="submit"
                    className="purple-button cursor-pointer w-full"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting ? "Отправка..." : "Отправить"}
                </Button>

                <Separator orientation="horizontal" className="bg-secondary my-4" />

                {/* LOGIN REDIRECT */}
                <div className="flex justify-between items-center">
                    <Link className="text-xs underline underline-offset-4 purple-text-hover" href="/login/">
                        Есть аккаунт? Логин
                    </Link>
                </div>
            </form>
        </Form>
    );
};