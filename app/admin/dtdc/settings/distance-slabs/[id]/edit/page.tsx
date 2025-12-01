import EditSlabForm from "./EditSlabForm";

export default async function Page(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;   // ✅ FIXED
  return <EditSlabForm id={id} />;
}