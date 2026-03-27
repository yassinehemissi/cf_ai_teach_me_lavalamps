export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#3a2923,_#17110f_55%,_#090708)] text-stone-100">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        {children}
      </section>
    </main>
  );
}
