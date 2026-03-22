import { Loader2 } from "lucide-react";
import Image from "next/image";

interface LoadingScreenProps {
  fullscreen?: boolean;
}

const LoadingScreen = ({ fullscreen = false }: LoadingScreenProps) => {
  const baseClasses =
    "flex flex-col gap-4 items-center justify-center bg-background/80 backdrop-blur-sm";
  const positionClasses = fullscreen
    ? "fixed inset-0 w-full h-full"
    : "w-full h-full min-h-[60vh]";

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <Image
        src="/logo-icon-light.svg"
        width={48}
        height={48}
        alt="Loading"
        className="h-10 w-10 animate-pulse block dark:hidden"
        style={{ animationDuration: "0.8s" }}
      />
      <Image
        src="/logo-icon-dark.svg"
        width={48}
        height={48}
        alt="Loading"
        className="h-10 w-10 animate-pulse hidden dark:block"
        style={{ animationDuration: "0.8s" }}
      />
      {/* <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-progress-bar" />
      </div> */}
    </div>
  );
};

export default LoadingScreen;
