import { Globe } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";

function Button({ className, asChild = false, variant = "primary", ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={twMerge(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
        variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400",
        className
      )}
      {...props}
    />
  );
}

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <Globe className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600" strokeWidth={1.5} />
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          We're setting up your site
        </h1>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          This won't take long.
        </p>
      </div>
    </div>
  );
}

export default App;
