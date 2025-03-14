"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/db/actions/user.actions';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Page = () => {
    const [name, setName] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        setIsSubmitting(true);

        try {
            await completeOnboarding(name);
            router.push('/');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute flex items-center justify-center w-full h-full z-[9999] bg-gradient-to-b from-violet-200 to-pink-200">
            <div className="w-full max-w-md p-6 border border-neutral-200 bg-white/50 backdrop-blur-[18px] rounded-xl">
                <h1 className="text-xl font-bold mb-6 text-center">Добро пожаловать в Ayfaar Radio</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            className={`rounded-full py-6 w-full px-6 ${isFocused ? 'bg-purple shadow-2xl shadow-purple-500/50' : ''}`}
                            placeholder="Введите свое имя"
                            required
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting || name.trim().length === 0}
                        className="cursor-pointer text-white font-bold relative w-full text-center bg-gradient-to-r from-violet-500 from-10% via-sky-500 via-30% to-pink-500 to-90% bg-[length:400%] rounded-[30px] hover:animate-gradient-xy hover:bg-[length:100%] before:content-[''] before:absolute before:-top-[5px] before:-bottom-[5px] before:-left-[5px] before:-right-[5px] before:bg-gradient-to-r before:from-violet-500 before:from-10% before:via-sky-500 before:via-30% before:to-pink-500 before:to-90% before:bg-[length:400%] before:-z-10 before:rounded-[35px] before:transition-all before:ease-in-out before:duration-[1s] hover:before:blur-xl hover:before:bg-[length:100%] active:bg-violet-700 focus:ring-violet-700"
                    >
                        {isSubmitting ? 'Подготовка...' : 'Войти'}
                    </Button>
                </form>
            </div >
        </div>
    );
}

export default Page;