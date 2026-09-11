// The sandbox entry point. It renders the REAL production component against
// dummy data, so anything you change in src/components/growth-execution is a
// change to the real UI and can be ported straight back.
import { GrowthExecutionRenderer } from "@/components/growth-execution/GrowthExecutionRenderer";
import type { GrowthExecutionContract } from "@/components/growth-execution/growth-execution-contract";
import sample from "../../sample/profile.json";

export default function Page() {
  // The stored document is { kind, profile }. The renderer takes the profile half.
  const profile = (sample as { profile: unknown }).profile as GrowthExecutionContract;
  return <GrowthExecutionRenderer profile={profile} />;
}
