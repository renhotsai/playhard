import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ScriptCard from "@/components/public/ScriptCard";

export default async function ScriptsPage() {
  const scripts = await prisma.script.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">所有劇本</h1>
        {scripts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            目前尚無上架劇本，請稍後再來
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {scripts.map((script) => (
              <ScriptCard key={script.id} {...script} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
