import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BackgroundGradientAnimation } from "@/components/aceternity/background-gradient-animation";
import { DemoGateCard } from "@/components/demo/DemoGateCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkDemoAccess } from "@/lib/demo-api";

export function RequestDemoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkError = searchParams.get("error") === "invalid-link"
    ? "This demo link is invalid or has expired. Request a new one below."
    : null;

  useEffect(() => {
    void checkDemoAccess().then((granted) => {
      if (granted) navigate("/demo", { replace: true });
    });
  }, [navigate]);

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(8, 8, 18)"
      gradientBackgroundEnd="rgb(0, 0, 0)"
      firstColor="79, 70, 229"
      secondColor="139, 92, 246"
      thirdColor="56, 189, 248"
      fourthColor="99, 102, 241"
      fifthColor="168, 85, 247"
      pointerColor="129, 140, 248"
      className="flex min-h-screen items-center justify-center px-4 py-28"
    >
      <div className="w-full max-w-lg space-y-4">
        {linkError ? (
          <Alert variant="destructive">
            <AlertDescription>{linkError}</AlertDescription>
          </Alert>
        ) : null}
        <DemoGateCard />
        <p className="text-center text-xs text-white/60">
          We email a personal link — no account needed. The link opens the live demo on this device.
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
}
