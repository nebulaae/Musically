import { ThemeSwitcher } from "@/components/functions/ThemeSwitcher";

const Page = () => {
    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            // TODO MAKE A TOAST
            if (!response.ok) {
                console.log("Failed to logout")
            }
        } catch (err) {
            console.error('Logout Error:', err);
        };
    };

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <ThemeSwitcher />
                </div>
            </div>
        </section>

    );
};

export default Page;