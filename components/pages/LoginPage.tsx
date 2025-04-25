"use client"

import Link from "next/link";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormValues, loginSchema } from "@/lib/validation";

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

export const LoginPage = () => {
    // ROUTER
    const router = useRouter();
    // FORM HOOK INITIALIZATION
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            usernameOrEmail: "",
            password: ""
        },
    });

    // FORM HANDLER
    // This function will be called when the form is submitted successfully (passes validation).
    const onSubmit = async (values: LoginFormValues) => {
        try {
            const response = await fetch('/api/auth/login', {
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
                toast.error(data.message || "Не удалось авторизоваться. Неверные данные или пароль.");
            }
        } catch (err) {
            toast.error("Произошла ошибка. Пожалуйста, попробуйте позже.");
        }

        form.reset();
    };

    return (
        <Form {...form}> {/* Spread form methods and state */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="container w-full max-w-[425px] space-y-4">
                <div className="flex flex-col gap-1">
                    <h1 className="title-text">Логин</h1>
                    <p className="subtitle-text">Заполните все поля.</p>
                </div>

                <Separator orientation="horizontal" className="bg-secondary my-4" />

                {/* USERNAME FIELD */}
                <FormField
                    control={form.control} // Connects to react-hook-form state
                    name="usernameOrEmail"
                    render={({ field }) => ( // `field` contains value, onChange, onBlur, etc.
                        <FormItem>
                            <FormLabel>Имя пользователя или электронная почта</FormLabel>
                            <FormControl>
                                <Input placeholder="Иван или name@example.com..." {...field} className="purple-input" />
                            </FormControl>
                            {/* Displays validation errors for this field */}
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
                    <Link className="text-xs underline underline-offset-4 purple-text-hover" href="/register/">
                        Нет аккаунта? Регистрация
                    </Link>
                </div>
            </form>
        </Form>
    );
};