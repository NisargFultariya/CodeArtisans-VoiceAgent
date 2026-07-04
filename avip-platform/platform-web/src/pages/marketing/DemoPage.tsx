import { DemoAccessGuard } from "@/components/demo/DemoAccessGuard";
import { DemoLivePanel } from "@/components/demo/DemoLivePanel";
import { useNavigate } from "react-router-dom";

export function DemoPage() {
  const navigate = useNavigate();

  return (
    <DemoAccessGuard>
      <DemoLivePanel onAccessLost={() => navigate("/request-demo", { replace: true })} />
    </DemoAccessGuard>
  );
}
