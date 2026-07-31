import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ScriptsGrid from "@/components/public/ScriptsGrid";

export default async function ScriptsPage() {
  const scripts = await prisma.script.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <h1 className="text-3xl font-bold font-heading text-white mb-8">所有劇本</h1>
        <ScriptsGrid scripts={scripts} />
      </main>
      <Footer />
    </div>
  );
}
