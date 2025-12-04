import TrackPage from "./ClientTrackWrapper";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);   // unwrap params
  const clientId = Number(id);

  return <TrackPage clientId={clientId} />;
}
