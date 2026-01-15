export default async function Home() {
  const res = await fetch("http://localhost:8000/health", { cache: "no-store" });
  const data = await res.json();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Care Portal</h1>
      <p>API status: {data.ok ? "Connected ✅" : "Offline ❌"}</p>
    </main>
  );
}
