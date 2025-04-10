import { useEffect } from "react";

export function Input({ label, error, className = "", prefix, ...props }: any) {
  useEffect(() => {
    const preventScroll = (event: WheelEvent) => {
      if (document.activeElement && (document.activeElement as HTMLInputElement).type === "number") {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventScroll);
    };
  }, []);

  return (
    <div className="space-y-2 my-2">
      <label htmlFor={props.id} className="block px-1 text-sm font-medium   text-white">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-300">
            {prefix}
          </span>
        )}
        <input
          className={`appearance-none block w-full bg-transparent bg-lightgray  py-2 rounded-2xl shadow-sm border border-gray-500 placeholder-gray-400  text-white focus:outline-none focus:ring-lime focus:border-lime sm:text-sm ${
            error ? "border-red-300" : ""
          } ${prefix ? "pl-8" : "px-3"} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
