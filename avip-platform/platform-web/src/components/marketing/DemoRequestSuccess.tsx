import { ApiError } from "@/lib/api";

export function demoRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function FormSuccessMessage({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/90 p-6 text-sm text-emerald-950">
      <p className="text-base font-semibold">{message}</p>
    </div>
  );
}
