"use client"

const Page = () => {

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const response = await fetch('/api/playlist/createPlaylist/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: "example" })
            });
            const data = await response.json();
            console.log(data);
        } catch (err) {
            console.error('Register Error:', err);
        }

    };

    return (
        <section>
            <button onClick={() => {onSubmit}}>make</button>
        </section>
    );
};

export default Page;